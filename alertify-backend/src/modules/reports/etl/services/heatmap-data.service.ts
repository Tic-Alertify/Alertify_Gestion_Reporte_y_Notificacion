import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfficialHistory } from '../../entities/official-history.entity';

/**
 * Interfaz para punto de heatmap individual
 */
export interface HeatmapPoint {
  id: number;
  latitude: number;
  longitude: number;
  count: number;
  intensity: number; // 0-100
  color: string; // Código HEX basado en intensidad
  date: Date;
  reportNumber?: string;
}

/**
 * Interfaz para punto agrupado (Cluster) para el Mapa de Android
 */
export interface AggregatedHeatmapPoint {
  latitude: number;
  longitude: number;
  reportCount: number;
  intensity: number;
  color: string;
  reports: { id: number; date: Date }[];
}

@Injectable()
export class HeatmapDataService {
  private readonly logger = new Logger(HeatmapDataService.name);

  constructor(
    @InjectRepository(OfficialHistory)
    private readonly officialHistoryRepo: Repository<OfficialHistory>,
  ) {}

  /**
   * 🛠️ CORRECCIÓN DE COORDENADAS: 
   * En el estándar WKT (SQL Server): POINT(X Y) -> X es Longitud, Y es Latitud.
   */
  private extractCoordinates(locationString: string): { lat: number; lng: number } {
    if (!locationString) {
      return { lat: 0, lng: 0 };
    }

    // Regex para extraer coordenadas de POINT(lng lat)
    const match = locationString.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    
    if (match) {
      // match[1] = Longitud (aprox -78.4)
      // match[2] = Latitud (aprox -0.18)
      return {
        lat: parseFloat(match[2]), // Guardamos Y en Latitud ✅
        lng: parseFloat(match[1]), // Guardamos X en Longitud ✅
      };
    }

    // Fallback por si los datos vienen como JSON string
    try {
      const parsed = JSON.parse(locationString);
      return { 
        lat: parsed.latitude || parsed.lat || 0, 
        lng: parsed.longitude || parsed.lng || 0 
      };
    } catch (e) {
      this.logger.warn(`No se pudieron extraer coordenadas de: ${locationString}`);
      return { lat: 0, lng: 0 };
    }
  }

  /**
   * Calcula intensidad (0-100) basada en la densidad de reportes
   */
  private calculateIntensity(reportCount: number): number {
    if (reportCount <= 0) return 0;
    if (reportCount === 1) return 15;
    if (reportCount <= 5) return 30;
    if (reportCount <= 10) return 50;
    if (reportCount <= 20) return 75;
    return 100;
  }

  /**
   * Genera el color HEX según la intensidad (Verde -> Amarillo -> Rojo)
   */
  private calculateColor(intensity: number): string {
    let r = 0, g = 255, b = 0;

    if (intensity <= 50) {
      r = Math.round((intensity / 50) * 255);
    } else {
      r = 255;
      g = Math.round(255 - ((intensity - 50) / 50) * 255);
    }

    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Obtiene todos los puntos de incidentes individuales
   */
  async getHeatmapPoints(daysBack: number = 30): Promise<HeatmapPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    try {
      const records = await this.officialHistoryRepo
        .createQueryBuilder('oh')
        .where('oh.FechaHoraOcurrencia >= :startDate', { startDate })
        .orderBy('oh.FechaHoraOcurrencia', 'DESC')
        .getMany();

      return records.map((record) => {
        const { lat, lng } = this.extractCoordinates(record.UbicacionGeografica);
        const intensity = this.calculateIntensity(1);

        return {
          id: record.IdHistorial,
          latitude: lat,
          longitude: lng,
          count: 1,
          intensity: intensity,
          color: this.calculateColor(intensity),
          date: record.FechaHoraOcurrencia,
          reportNumber: record.IdExterno,
        };
      });
    } catch (error) {
      this.logger.error('Error en getHeatmapPoints', error);
      throw error;
    }
  }

  /**
   * Obtiene puntos agrupados por ubicación con conteo e intensidad
   */
  async getAggregatedHeatmapPoints(daysBack: number = 30): Promise<AggregatedHeatmapPoint[]> {
    const points = await this.getHeatmapPoints(daysBack);
    const grouped: { [key: string]: AggregatedHeatmapPoint } = {};

    points.forEach((point) => {
      // Agrupamos con precisión de 4 decimales (~11 metros)
      const latKey = point.latitude.toFixed(4);
      const lngKey = point.longitude.toFixed(4);
      const key = `${latKey},${lngKey}`;

      if (!grouped[key]) {
        grouped[key] = {
          latitude: parseFloat(latKey),
          longitude: parseFloat(lngKey),
          reportCount: 0,
          intensity: 0,
          color: '',
          reports: [],
        };
      }

      grouped[key].reportCount += 1;
      grouped[key].reports.push({ id: point.id, date: point.date });
    });

    return Object.values(grouped).map((group) => {
      const intensity = this.calculateIntensity(group.reportCount);
      return {
        ...group,
        intensity,
        color: this.calculateColor(intensity),
      };
    });
  }

  /**
   * 🧩 MANTENIDO: Obtiene clusters basados en la agregación geográfica
   */
  async getHeatmapClusters(
    radiusKm: number = 0.5,
    daysBack: number = 30,
  ): Promise<AggregatedHeatmapPoint[]> {
    // Reutilizamos la lógica de agregación para mantener consistencia
    return await this.getAggregatedHeatmapPoints(daysBack);
  }

  /**
   * Obtiene estadísticas diarias de reportes
   */
  async getDailyStats(daysBack: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    try {
      const records = await this.officialHistoryRepo
        .createQueryBuilder('oh')
        .where('oh.FechaHoraOcurrencia >= :startDate', { startDate })
        .getMany();

      const statsByDate: { [key: string]: number } = {};
      records.forEach((record) => {
        const dateStr = record.FechaHoraOcurrencia.toISOString().split('T')[0];
        statsByDate[dateStr] = (statsByDate[dateStr] || 0) + 1;
      });

      return Object.entries(statsByDate).map(([date, count]) => ({
        date,
        count,
      }));
    } catch (error) {
      this.logger.error('Error en getDailyStats', error);
      throw error;
    }
  }
}