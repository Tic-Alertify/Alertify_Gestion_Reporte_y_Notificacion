import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../reports/entities/report.entity';
import { User } from '../identity/entities/user.entity';

@Processor('report-validation') // Nombre de la cola definida anteriormente
export class ValidationProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  async process(job: Job<{ reportId: number; location: string }>) {
    const { reportId, location } = job.data;
    
    // 1. Obtener datos del reporte y del usuario (T17 - Reputación)
    const report = await this.reportRepository.findOne({
        where: { IdReporte: reportId },
    });

        if (!report) {
        throw new Error(`Report with id ${reportId} not found`);
    }
    
    const user = await this.userRepository.findOne({
        where: { IdUsuario: report.IdUsuario },
    });

    if (!user) {
        throw new Error(`User with id ${report.IdUsuario} not found`);
    }
    
    // 2. Ejecutar Algoritmo de Confianza (CS)
    const scoreReputation = user.PuntajeReputacion / 10; // Normalizado 0-1 [cite: 656]
    
    // 3. Plausibilidad Histórica y Clusters (T17 - Consulta Espacial) [cite: 585]
    const historicalDensity = await this.calculateHistoricalDensity(location);
    const clusterDensity = await this.calculateLiveClusters(location);

    // Fórmula del Algoritmo de Confianza (Pesos configurables)
    const finalCS = (scoreReputation * 0.4) + (historicalDensity * 0.3) + (clusterDensity * 0.3);

    // 4. Actualizar estado y puntaje del reporte [cite: 625, 626]
    report.PuntajeConfianza = finalCS;
    if (finalCS >= 0.7) {
      report.Estado = 1; // Validado [cite: 676, 677]
      // Aquí se llamaría al servicio de Firebase (T11) [cite: 623, 624]
    } else {
      report.Estado = 2; // Rechazado o requiere más votos
    }

    await this.reportRepository.save(report);
  }

  // T10: Consulta espacial en SQL Server usando STDistance [cite: 585]
  private async calculateHistoricalDensity(locationWkt: string): Promise<number> {
    const radius = 500; // metros
    const result = await this.reportRepository.query(`
      SELECT COUNT(*) as count 
      FROM HISTORIAL_OFICIAL_INCIDENTES 
      WHERE UbicacionGeografica.STDistance(geography::STGeomFromText('${locationWkt}', 4326)) <= ${radius}
    `);
    // Retorna un factor basado en la cantidad de incidentes previos en la zona
    return result[0].count > 5 ? 1 : 0.5;
  }

  private async calculateLiveClusters(locationWkt: string): Promise<number> {
    // Busca otros reportes ciudadanos similares en la última hora para validar el evento
    return 0.8; // Ejemplo simplificado
  }
}