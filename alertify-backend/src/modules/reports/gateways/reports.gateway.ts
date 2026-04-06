import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ReportsService } from '../reports.service';

/**
 * WebSocket Gateway para emitir eventos de reportes en tiempo real
 * Eventos:
 * - new-report: Se emite cuando se crea un nuevo reporte
 * - heatmap-update: Se emite cuando hay actualización en el heatmap
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/reports',
})
export class ReportsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ReportsGateway.name);

  constructor(private readonly reportsService: ReportsService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // Enviar bienvenida con información del servidor
    client.emit('connected', {
      message: 'Conectado al servidor de reportes Alertify ECU911',
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emitir evento de nuevo reporte a todos los clientes conectados
   * @param reportData Datos del reporte
   */
  emitNewReport(reportData: any) {
    this.logger.debug(
      `Emitiendo nuevo reporte: ${JSON.stringify(reportData)}`,
    );
    this.server.emit('new-report', {
      data: reportData,
      timestamp: new Date(),
    });
  }

  /**
   * Emitir actualización de heatmap a todos los clientes
   * @param heatmapPoints Puntos actualizado del heatmap
   */
  emitHeatmapUpdate(heatmapPoints: any) {
    this.logger.debug(`Emitiendo actualización de heatmap`);
    this.server.emit('heatmap-update', {
      data: heatmapPoints,
      timestamp: new Date(),
    });
  }

  /**
   * Evento para solicitar datos actualizados del heatmap
   */
  @SubscribeMessage('request-heatmap')
  async handleRequestHeatmap(client: Socket, payload: any) {
    this.logger.log(`Cliente ${client.id} solicita datos de heatmap`);
    try {
      const heatmapData = await this.reportsService.getHeatmapDataWithIntensity(
        payload?.daysBack || 30,
      );
      client.emit('heatmap-data', heatmapData);
    } catch (error) {
      this.logger.error('Error al obtener datos de heatmap', error);
      client.emit('error', { message: 'Error obteniendo datos de heatmap' });
    }
  }

  /**
   * Evento para obtener reportes en tiempo real
   */
  @SubscribeMessage('subscribe-live-reports')
  handleSubscribeLiveReports(client: Socket, payload: any) {
    this.logger.log(`Cliente ${client.id} se suscribe a reportes en vivo`);
    client.join('live-reports');
    client.emit('subscribed', { message: 'Suscrito a reportes en vivo' });
  }

  /**
   * Evento para cancelar suscripción de reportes en vivo
   */
  @SubscribeMessage('unsubscribe-live-reports')
  handleUnsubscribeLiveReports(client: Socket, payload: any) {
    this.logger.log(
      `Cliente ${client.id} se desuscribe de reportes en vivo`,
    );
    client.leave('live-reports');
    client.emit('unsubscribed', {
      message: 'Desuscrito de reportes en vivo',
    });
  }
}
