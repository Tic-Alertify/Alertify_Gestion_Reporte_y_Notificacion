import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    
    // Inyectamos la cola de Redis para validación asíncrona (T17)
    @InjectQueue('report-validation') 
    private readonly reportQueue: Queue,
  ) {}

  

  async ingestReport(dto: CreateReportDto): Promise<Report> {
    // 1. VALIDACIÓN GEOGRÁFICA (Geofencing) - Quito
    const QUITO_BOUNDS = { north: 0.05, south: -0.35, west: -78.60, east: -78.35 };

    // Debemos usar dto.latitude y dto.longitude
    if (dto.latitude > QUITO_BOUNDS.north || dto.latitude < QUITO_BOUNDS.south || 
        dto.longitude > QUITO_BOUNDS.east || dto.longitude < QUITO_BOUNDS.west) {
      
      // Si está fuera, lanzamos el error antes de guardar nada
      throw new BadRequestException('El incidente se encuentra fuera de la zona de cobertura (Quito).');
    }

    // 2. Transformar a formato WKT para SQL Server
    const pointWkt = `POINT(${dto.longitude} ${dto.latitude})`;

    // 3. Crear la entidad
    const newReport = this.reportRepository.create({
      IdUsuario: dto.userId,
      IdTipoIncidente: dto.incidentTypeId,
      UbicacionGeografica: pointWkt,
      Descripcion: dto.description,
      Estado: 0, // Inicia como "Pendiente"
      PuntajeConfianza: 0.0,
    });

    // 4. Persistir en SQL Server
    const savedReport = await this.reportRepository.save(newReport);

    // 5. Publicar en el Bus de Eventos (T17)
    await this.reportQueue.add('validate-report', {
      reportId: savedReport.IdReporte,
      location: pointWkt
    });

    return savedReport;
  }

  async getValidatedReports() {
  return await this.reportRepository
    .createQueryBuilder('report')
    .select([
      'report.IdReporte as id',
      'report.Descripcion as description',
      'report.UbicacionGeografica.Lat as latitude',
      'report.UbicacionGeografica.Long as longitude'
    ])
    .where('report.Estado = :estado', { estado: 1 })
    .getRawMany(); 
  }

  
}