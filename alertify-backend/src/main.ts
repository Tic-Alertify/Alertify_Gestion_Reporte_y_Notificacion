import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger, ValidationPipe } from '@nestjs/common';

/**
 * Bootstraps the Alertify backend server with all required middleware and adapters.
 * Initializes NestJS app, configures CORS, validation pipes, WebSocket support,
 * and starts listening on the configured port.
 */
async function bootstrap() {
  const logger = new Logger('AlertifyBootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for all origins. In production, restrict to specific domains.
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Apply global validation pipes: strip unknown properties, enforce DTOs, auto-transform types.
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable Socket.io adapter for real-time incident report broadcasting.
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Alertify backend started on port ${port}`);
  logger.log(`API endpoint: http://localhost:${port}`);
  logger.log(`WebSocket gateway: ws://localhost:${port}/reports`);
}

bootstrap().catch(err => {
  const logger = new Logger('BootstrapError');
  logger.error('Critical error during bootstrap:', err);
  process.exit(1);
});