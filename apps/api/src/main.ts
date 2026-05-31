import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('KODIRA API')
    .setVersion('1.0.0')
    .addServer('/api/v1')
    .build();

  const openapiDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, openapiDocument);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? true,
    credentials: true,
  });

  const portRaw = process.env.PORT;
  const port = portRaw && portRaw.length > 0 ? Number(portRaw) : 8000;
  await app.listen(port);
  process.stdin.resume();
}
bootstrap().catch((err) => {
  const message =
    err instanceof Error ? err.stack ?? err.message : typeof err === 'string' ? err : 'Unknown error';
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
