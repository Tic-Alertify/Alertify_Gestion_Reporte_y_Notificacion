import {
  Controller,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IdentityService } from './identity.service';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

/**
 * Controlador REST para operaciones de identidad y configuración de dispositivo.
 *
 * Endpoints expuestos:
 *   PATCH /users/:id/fcm-token  → Registra/actualiza el token FCM del dispositivo
 *   PATCH /users/:id/location   → Actualiza la ubicación GPS del usuario
 *
 * Nota sobre autenticación (Sprint 4):
 *   Los endpoints están desprotegidos temporalmente para facilitar las pruebas.
 *   Cuando se integre el microservicio de autenticación, agregar el guard:
 *   @UseGuards(JwtAuthGuard)  ← descomentar cuando el auth-service esté conectado
 */
@Controller('users')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  /**
   * Registra o actualiza el token FCM del dispositivo Android del usuario.
   *
   * Llamar desde Android en:
   *   - FirebaseMessagingService.onNewToken(token)  → cuando Firebase rota el token
   *   - MainActivity.onCreate()                     → al iniciar la app
   *
   * @param id      ID del usuario autenticado
   * @param body    { fcmToken: string | null }
   */
  @Patch(':id/fcm-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateFcmToken(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateFcmTokenDto,
  ): Promise<void> {
    await this.identityService.updateFcmToken(id, body.fcmToken);
  }

  /**
   * Actualiza la última ubicación GPS conocida del usuario.
   *
   * Estrategia de eficiencia para no consumir recursos Firebase:
   *   - Llamar SOLO en onStart() y onResume() de MainActivity (Android)
   *   - NO usar background polling continuo
   *   - El backend filtra por proximidad usando STDistance sobre esta ubicación
   *   - Si el usuario está cerca de un nuevo reporte → FCM push automático
   *   - Si no está cerca → ningún mensaje enviado (FCM no se consume)
   *
   * @param id      ID del usuario autenticado
   * @param body    { latitude: number, longitude: number }
   */
  @Patch(':id/location')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLocationDto,
  ): Promise<void> {
    await this.identityService.updateLocation(id, body.latitude, body.longitude);
  }
}
