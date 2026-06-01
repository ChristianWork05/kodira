import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { EducationModule } from './education/education.module';

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
  // Usamos TestingModule para bootstrap sin necesidad de "listen" y con init consistente
  // (esto ha resultado más estable para extraer el document de Swagger).
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
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
    include: [HealthModule, UsersModule, AuthModule, EducationModule],
  });

  const repoRoot = findRepoRoot(__dirname);
  const outputPath = path.resolve(repoRoot, 'docs', 'openapi.json');
  if (process.env.OPENAPI_DEBUG === '1') {
    process.stderr.write(`openapi: outputPath=${outputPath}\n`);
  }
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
