import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AppModule } from './app.module';

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('KODIRA API')
    .setVersion('1.0.0')
    .addServer('/api/v1')
    .build();

  const openapiDocument = SwaggerModule.createDocument(app, swaggerConfig);

  const outputPath = path.resolve(
    process.cwd(),
    '..',
    '..',
    'docs',
    'openapi.json',
  );
  fs.writeFileSync(
    outputPath,
    JSON.stringify(openapiDocument, null, 2),
    'utf8',
  );

  await app.close();
}

generateOpenApi().catch((err) => {
  const message =
    err instanceof Error
      ? (err.stack ?? err.message)
      : typeof err === 'string'
        ? err
        : 'Unknown error';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
