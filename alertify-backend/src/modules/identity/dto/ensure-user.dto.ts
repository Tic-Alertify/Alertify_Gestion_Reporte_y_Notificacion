import { IsInt, Min } from 'class-validator';

export class EnsureUserDto {
  /**
   * ID del usuario autenticado enviado por el servicio de autenticación.
   */
  @IsInt()
  @Min(1)
  userId: number;
}
