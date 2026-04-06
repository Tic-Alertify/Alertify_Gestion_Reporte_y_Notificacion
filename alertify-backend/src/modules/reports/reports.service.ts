import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { HeatmapDataService } from './etl/services/heatmap-data.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    
    // Inyectamos la cola de Redis para validación asíncrona (T17)
    @InjectQueue('report-validation') 
    private readonly reportQueue: Queue,

    // Inyectamos el servicio de heatmap
    private readonly heatmapDataService: HeatmapDataService,
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

    // 2. Crear la entidad con coordenadas (el transformer las convierte a WKT)
    const newReport = this.reportRepository.create({
      IdUsuario: dto.userId,
      IdTipoIncidente: dto.incidentTypeId,
      UbicacionGeografica: {
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      Descripcion: dto.description,
      Estado: 0, // Inicia como "Pendiente"
      PuntajeConfianza: 0.0,
    });

    // 3. Persistir en SQL Server
    const savedReport = await this.reportRepository.save(newReport);

    // 4. Publicar en el Bus de Eventos (T17)
    await this.reportQueue.add('validate-report', {
      reportId: savedReport.IdReporte,
      location: {
        latitude: dto.latitude,
        longitude: dto.longitude,
      }
    });

    return savedReport;
  }

  async getValidatedReports() {
    const reports = await this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.tipoIncidente', 'type')
      .where('report.Estado = :estado', { estado: 1 })
      .getMany();

      return reports.map(r => ({
      id: r.IdReporte,
      description: r.Descripcion,
      incidentType: r.tipoIncidente?.Nombre || 'Incidente',
      trustScore: r.PuntajeConfianza,
      estado: r.Estado, // 
      latitude: r.UbicacionGeografica?.latitude ?? 0,
      longitude: r.UbicacionGeografica?.longitude ?? 0,
      createdAt: r.FechaHoraRegistro,
    }));
  }

  async getUserReports(userId: number) {
    const reports = await this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.tipoIncidente', 'type')
      .where('report.IdUsuario = :userId', { userId })
      .orderBy('report.FechaHoraRegistro', 'DESC')
      .getMany();

    return reports.map(r => ({
      id: r.IdReporte,
      description: r.Descripcion,
      incidentType: r.tipoIncidente?.Nombre || 'Incidente',
      trustScore: r.PuntajeConfianza,
      estado: r.Estado,
      latitude: r.UbicacionGeografica?.latitude ?? 0,
      longitude: r.UbicacionGeografica?.longitude ?? 0,
      createdAt: r.FechaHoraRegistro
    }));
  }

  /**
   * Obtiene datos de heatmap con intensidad basada en cantidad de reportes
   */
  async getHeatmapDataWithIntensity(daysBack: number = 30) {
    const aggregated = await this.heatmapDataService.getAggregatedHeatmapPoints(
      daysBack,
    );

    return {
      points: aggregated,
      totalLocations: aggregated.length,
      totalReports: aggregated.reduce(
        (sum, point) => sum + point.reportCount,
        0,
      ),
      generatedAt: new Date(),
    };
  }

  /**
   * Obtiene puntos de heatmap individuales
   */
  async getHeatmapPoints(daysBack: number = 30) {
    const points = await this.heatmapDataService.getHeatmapPoints(daysBack);
    return {
      points,
      totalPoints: points.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Obtiene estadísticas diarias de reportes
   */
  async getDailyStats(daysBack: number = 30) {
    const stats = await this.heatmapDataService.getDailyStats(daysBack);
    return {
      stats,
      period: { daysBack, from: new Date(Date.now() - daysBack * 86400000) },
      generatedAt: new Date(),
    };
  }

  /**
   * Obtiene clusters de reportes agrupados
   */
  async getHeatmapClusters(radiusKm: number = 0.5, daysBack: number = 30) {
    const clusters = await this.heatmapDataService.getHeatmapClusters(
      radiusKm,
      daysBack,
    );
    return {
      clusters,
      radiusKm,
      totalClusters: clusters.length,
      generatedAt: new Date(),
    };
  }

}