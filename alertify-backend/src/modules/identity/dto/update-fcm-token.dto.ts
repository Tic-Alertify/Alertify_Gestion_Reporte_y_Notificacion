import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class UpdateFcmTokenDto {
  /**
   * Token FCM del dispositivo Android.
   * Enviar null o string vacío para desregistrar el dispositivo.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fcmToken: string | null;
}
