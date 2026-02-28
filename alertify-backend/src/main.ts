import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Permite que el celular se conecte
  await app.listen(3000, '0.0.0.0'); 
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Visible en la red: http://192.168.100.35:3000`);
}
bootstrap();
