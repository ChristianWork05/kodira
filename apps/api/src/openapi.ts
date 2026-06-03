import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from './app.module';

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, 'pnpm-workspace.yaml');
    if (fs.existsSync(candidate)) return dir;
    const next = path.dirname(dir);
    if (next === dir) break;
    dir = next;
  }
  return startDir;
}

async function generateOpenApi() {
  if (process.env.OPENAPI_DEBUG === '1') {
    process.stderr.write('openapi: start\n');
  }

  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'openapi_jwt_secret';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? 'openapi_refresh_secret';

  const mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  process.env.MONGODB_URI = mongoUri;
  process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';

  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  await app.init();

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

  const repoRoot = findRepoRoot(process.cwd());
  const outputPath = path.resolve(repoRoot, 'docs', 'openapi.json');
  if (process.env.OPENAPI_DEBUG === '1') {
    process.stderr.write(`openapi: outputPath=${outputPath}\n`);
  }
  if (process.env.OPENAPI_DEBUG === '1') {
    process.stderr.write('openapi: writing\n');
  }
  fs.writeFileSync(
    outputPath,
    JSON.stringify(openapiDocument, null, 2),
    'utf8',
  );
  if (process.env.OPENAPI_DEBUG === '1') {
    process.stderr.write('openapi: written\n');
  }

  await app.close();
  await mongo.stop();
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
