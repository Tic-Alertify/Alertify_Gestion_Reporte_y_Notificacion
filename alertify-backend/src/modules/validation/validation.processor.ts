import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../reports/entities/report.entity';
import { User } from '../identity/entities/user.entity';
import { ReportsGateway } from '../reports/gateways/reports.gateway';
import { HeatmapDataService } from '../reports/etl/services/heatmap-data.service';

@Processor('report-validation') // Nombre de la cola definida anteriormente
export class ValidationProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly reportsGateway: ReportsGateway,
    private readonly heatmapDataService: HeatmapDataService,
     // Para emitir eventos en tiempo real
  ) {
    super();
  }

  async process(job: Job<{ reportId: number; location: { latitude: number; longitude: number } }>) {
    const { reportId, location } = job.data;
    
    // 1. Obtener datos del reporte y del usuario (T17 - Reputación)
    const report = await this.reportRepository.findOne({
        where: { IdReporte: reportId },
    });

        if (!report) {
        throw new Error(`Report with id ${reportId} not found`);
    }
    
    const coords = report.UbicacionGeografica;

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
    const clusterDensity = await this.calculateLiveClusters(location, reportId);

    // Fórmula del Algoritmo de Confianza (Pesos configurables)
    const finalCS = (scoreReputation * 0.4) + (historicalDensity * 0.3) + (clusterDensity * 0.3);

    // 4. Actualizar estado y puntaje del reporte [cite: 625, 626]
    report.PuntajeConfianza = finalCS;
    if (finalCS >= 0.60) {
      report.Estado = 1; // Validado [cite: 676, 677]
      
      this.reportsGateway.emitNewReport({
        id: report.IdReporte,
        description: report.Descripcion,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        trustScore: finalCS
      });

      const heatmapPoints = await this.heatmapDataService.getHeatmapPoints(30);
      this.reportsGateway.emitHeatmapUpdate(heatmapPoints);
    } else {
      report.Estado = 2; // Rechazado o requiere más votos
    }

    await this.reportRepository.save(report);
  }

  // T10: Consulta espacial en SQL Server usando STDistance [cite: 585]
  private async calculateHistoricalDensity(location: { latitude: number; longitude: number }): Promise<number> {
    const radius = 500; //metros
    const locationWkt = `POINT(${location.longitude} ${location.latitude})`;
    const result = await this.reportRepository.query(
      `SELECT COUNT(*) as count 
      FROM HISTORIAL_OFICIAL_INCIDENTES 
      WHERE UbicacionGeografica.STDistance(geography::STGeomFromText(@0, 4326)) <= @1`,
      [locationWkt, radius] 
    );
    
    return result[0].count > 5 ? 1.0 : 0.5;
  }

  private async calculateLiveClusters(location: { latitude: number; longitude: number }, currentReportId: number): Promise<number> {
    const radius = 500; // metros
    const oneHourAgo = new Date(Date.now() - 3600000); // 1 hora atrás
    const locationWkt = `POINT(${location.longitude} ${location.latitude})`;

    // Buscamos otros reportes ciudadanos similares recientes
    const result = await this.reportRepository.query(
      `SELECT COUNT(*) as count FROM REPORTES_CIUDADANOS 
       WHERE IdReporte != @0 
       AND FechaHoraRegistro >= @1
       AND Estado IN (0, 1) -- Pendientes o Validados
       AND UbicacionGeografica.STDistance(geography::STGeomFromText(@2, 4326)) <= @3`,
      [currentReportId, oneHourAgo, locationWkt, radius]
    );

    const count = parseInt(result[0].count);
    if (count === 0) return 0.2; // Sin apoyo social
    if (count <= 2) return 0.6; // Poco apoyo
    return 1.0; // Gran consenso ciudadano
  }

}