import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

describe('OpenAPI document (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.MONGODB_URI =
      process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/kodira_test';
    process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test_jwt_secret';
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET ?? 'test_refresh_secret';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('includes Auth and Users endpoints', () => {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('KODIRA API')
      .setVersion('1.0.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'bearer',
      )
      .build();

    const doc = SwaggerModule.createDocument(app, swaggerConfig, {
      deepScanRoutes: true,
    });

    const paths = Object.keys(doc.paths ?? {});
    expect(paths.some((p) => p.startsWith('/auth'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/users'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/courses'))).toBe(true);
  });
});

