import { IsNumber, Min, Max } from 'class-validator';

export class UpdateLocationDto {
  /**
   * Latitud GPS del dispositivo.
   * Rango válido: -90 a 90
   */
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  /**
   * Longitud GPS del dispositivo.
   * Rango válido: -180 a 180
   */
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
