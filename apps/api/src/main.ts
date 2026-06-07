import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('KODIRA API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();

  const openapiDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup('api/v1/docs', app, openapiDocument);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        return ApiExceptionFilter.validationException(errors);
      },
    }),
  );

  app.useGlobalFilters(new ApiExceptionFilter());

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
