import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { User, UserSchema } from './users/schemas/user.schema';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { Course, CourseSchema } from './education/schemas/course.schema';
import { Category, CategorySchema } from './education/schemas/category.schema';
import { Enrollment, EnrollmentSchema } from './education/schemas/enrollment.schema';
import { EducationController } from './education/education.controller';
import { EducationService } from './education/education.service';
import { EnrollmentService } from './education/enrollment.service';
import { EducationMeController } from './education/me.controller';
import { LessonsController } from './education/lessons.controller';

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

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      PassportModule,
      JwtModule.registerAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          secret: config.get<string>('JWT_SECRET'),
        }),
      }),
      MongooseModule.forRoot(mongoUri),
      MongooseModule.forFeature([
        { name: User.name, schema: UserSchema },
        { name: Course.name, schema: CourseSchema },
        { name: Category.name, schema: CategorySchema },
        { name: Enrollment.name, schema: EnrollmentSchema },
      ]),
    ],
    controllers: [
      HealthController,
      UsersController,
      AuthController,
      EducationController,
      EducationMeController,
      LessonsController,
    ],
    providers: [
      HealthService,
      UsersService,
      AuthService,
      JwtStrategy,
      EducationService,
      EnrollmentService,
    ],
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
  });

  const repoRoot = findRepoRoot(__dirname);
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
