import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * Estructura del job que viaja en la cola 'alert-dispatch'.
 * Publicado por ValidationProcessor cuando un reporte es validado (CS >= 0.60).
 */
export class AlertDispatchDto {
  /** ID del reporte ciudadano que desencadena la alerta */
  @IsNumber()
  reportId: number;

  /** ID del tipo de incidente (para construir el mensaje de alerta) */
  @IsNumber()
  incidentTypeId: number;

  /** Nombre del tipo de incidente (ej: "Robo", "Disturbio") */
  @IsOptional()
  @IsString()
  incidentTypeName?: string;

  /** Coordenadas geográficas del incidente validado */
  @IsObject()
  location: {
    latitude: number;
    longitude: number;
  };

  /** Puntaje de confianza del reporte (0.0 – 1.0) */
  @IsNumber()
  trustScore: number;

  /** Timestamp de cuándo fue validado el reporte */
  timestamp: Date;
}
