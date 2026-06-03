import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { EMAIL_QUEUE } from '../src/auth/emails/emails.constants';
import { UsersService } from '../src/users/users.service';
import { User, UserSchema } from '../src/users/schemas/user.schema';
import { EducationController } from '../src/education/education.controller';
import { EducationService } from '../src/education/education.service';
import { Course, CourseSchema } from '../src/education/schemas/course.schema';
import { Category, CategorySchema } from '../src/education/schemas/category.schema';
import { StorageController } from '../src/storage/storage.controller';
import { StorageService } from '../src/storage/storage.service';

describe('Storage (e2e in-memory)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let usersService: UsersService;

  const emailQueue = { add: jest.fn() };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

    process.env.R2_ACCOUNT_ID = 'test_account_id';
    process.env.R2_ENDPOINT = 'https://test_account_id.r2.cloudflarestorage.com';
    process.env.R2_ACCESS_KEY_ID = 'test_access_key_id';
    process.env.R2_SECRET_ACCESS_KEY = 'test_secret_access_key';
    process.env.R2_BUCKET = 'kodira-media';
    process.env.R2_PUBLIC_URL = 'https://public.example.com';

    mongo = await MongoMemoryServer.create();
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
        ]),
      ],
      controllers: [AuthController, EducationController, StorageController],
      providers: [
        UsersService,
        AuthService,
        JwtStrategy,
        EducationService,
        StorageService,
        { provide: EMAIL_QUEUE, useValue: emailQueue },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => ApiExceptionFilter.validationException(errors),
      }),
    );
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    usersService = moduleRef.get(UsersService);
  });

  afterAll(async () => {
    await app.close();
    await mongo.stop();
  });

  it('returns a presigned uploadUrl for course owner (instructor)', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'inst@mail.com',
        password: 'password1',
        username: 'instructor_1',
        fullName: 'Instructor One',
      })
      .expect(201);

    const userId = registerRes.body.user.id as string;
    await usersService.addRole(userId, 'instructor');
    const accessToken = registerRes.body.tokens.accessToken as string;

    const createCourseRes = await request(app.getHttpServer())
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Curso con media',
        level: 'beginner',
        language: 'es',
        price: 0,
        discountPrice: null,
        isFree: true,
        categoryId: null,
      })
      .expect(201);

    const courseId = createCourseRes.body.id as string;

    const storageRes = await request(app.getHttpServer())
      .post('/api/v1/storage/upload-url')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        kind: 'video',
        filename: 'intro.mp4',
        contentType: 'video/mp4',
        sizeBytes: 1234,
        courseId,
      })
      .expect(200);

    expect(typeof storageRes.body.uploadUrl).toBe('string');
    expect(storageRes.body.uploadUrl.startsWith('https://')).toBe(true);
    expect(storageRes.body.uploadUrl).toContain('X-Amz-SignedHeaders=host');
    expect(storageRes.body.uploadUrl).not.toContain('x-amz-checksum-crc32');
    expect(storageRes.body.uploadUrl).not.toContain('x-amz-sdk-checksum-algorithm');
    expect(storageRes.body.uploadUrl).not.toContain('SignedHeaders=content-length');
    expect(typeof storageRes.body.publicUrl).toBe('string');
    expect(storageRes.body.publicUrl).toContain('/courses/');
    expect(typeof storageRes.body.key).toBe('string');
    expect(storageRes.body.key).toContain(`courses/${courseId}/video/`);
  });

  it('rejects non-owner instructor with 403', async () => {
    const ownerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'owner@mail.com',
        password: 'password1',
        username: 'owner_1',
        fullName: 'Owner One',
      })
      .expect(201);
    const ownerId = ownerRes.body.user.id as string;
    await usersService.addRole(ownerId, 'instructor');
    const ownerToken = ownerRes.body.tokens.accessToken as string;

    const otherRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'other@mail.com',
        password: 'password1',
        username: 'other_1',
        fullName: 'Other One',
      })
      .expect(201);
    const otherId = otherRes.body.user.id as string;
    await usersService.addRole(otherId, 'instructor');
    const otherToken = otherRes.body.tokens.accessToken as string;

    const courseRes = await request(app.getHttpServer())
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Curso privado',
        level: 'beginner',
        language: 'es',
        price: 0,
        discountPrice: null,
        isFree: true,
        categoryId: null,
      })
      .expect(201);
    const courseId = courseRes.body.id as string;

    await request(app.getHttpServer())
      .post('/api/v1/storage/upload-url')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        kind: 'video',
        filename: 'intro.mp4',
        contentType: 'video/mp4',
        sizeBytes: 1234,
        courseId,
      })
      .expect(403);
  });

  it('rejects invalid contentType and oversized files with 400', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'inst3@mail.com',
        password: 'password1',
        username: 'instructor_3',
        fullName: 'Instructor Three',
      })
      .expect(201);
    const userId = registerRes.body.user.id as string;
    await usersService.addRole(userId, 'instructor');
    const accessToken = registerRes.body.tokens.accessToken as string;

    const createCourseRes = await request(app.getHttpServer())
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Curso 3',
        level: 'beginner',
        language: 'es',
        price: 0,
        discountPrice: null,
        isFree: true,
        categoryId: null,
      })
      .expect(201);
    const courseId = createCourseRes.body.id as string;

    const invalidTypeRes = await request(app.getHttpServer())
      .post('/api/v1/storage/upload-url')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        kind: 'video',
        filename: 'intro.mp4',
        contentType: 'image/png',
        sizeBytes: 1234,
        courseId,
      })
      .expect(400);
    expect(invalidTypeRes.body.code).toBe('VALIDATION_ERROR');

    const oversizedRes = await request(app.getHttpServer())
      .post('/api/v1/storage/upload-url')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        kind: 'image',
        filename: 'thumb.png',
        contentType: 'image/png',
        sizeBytes: 6 * 1024 * 1024,
        courseId,
      })
      .expect(400);
    expect(oversizedRes.body.code).toBe('VALIDATION_ERROR');
  });
});

