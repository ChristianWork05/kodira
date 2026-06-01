import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Model } from 'mongoose';
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

describe('Education (e2e in-memory)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let categoryModel: Model<Category>;
  let usersService: UsersService;

  const emailQueue = { add: jest.fn() };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

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
      controllers: [AuthController, EducationController],
      providers: [
        UsersService,
        AuthService,
        JwtStrategy,
        EducationService,
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

    categoryModel = moduleRef.get(getModelToken(Category.name));
    usersService = moduleRef.get(UsersService);
  });

  afterAll(async () => {
    await app.close();
    await mongo.stop();
  });

  it('create draft -> add section/lesson -> publish -> public sanitize', async () => {
    const category = await categoryModel.create({
      name: 'Backend',
      slug: 'backend',
      icon: 'code',
      order: 1,
    });

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

    const otherRegisterRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'inst2@mail.com',
        password: 'password1',
        username: 'instructor_2',
        fullName: 'Instructor Two',
      })
      .expect(201);
    const otherUserId = otherRegisterRes.body.user.id as string;
    await usersService.addRole(otherUserId, 'instructor');
    const otherAccessToken = otherRegisterRes.body.tokens.accessToken as string;

    const createCourseRes = await request(app.getHttpServer())
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Mi Curso de Backend',
        level: 'beginner',
        language: 'es',
        price: 0,
        discountPrice: null,
        isFree: true,
        thumbnailUrl: 'https://example.com/thumb.png',
        categoryId: category._id.toString(),
      })
      .expect(201);

    expect(createCourseRes.body.state).toBe('draft');
    const courseId = createCourseRes.body.id as string;
    const slug = createCourseRes.body.slug as string;

    await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/sections`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .send({ title: 'Hack' })
      .expect(403);

    const addSectionRes = await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/sections`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Sección 1' })
      .expect(201);
    expect(addSectionRes.body.sections.length).toBe(1);
    const sectionId = addSectionRes.body.sections[0].id as string;

    const addLessonRes = await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/sections/${sectionId}/lessons`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Lección 1',
        type: 'code',
        isFreePreview: false,
        content: 'secret',
        codeExercise: { prompt: 'x', starterCode: 'y', solutionCode: 'z' },
      })
      .expect(201);

    expect(addLessonRes.body.sections[0].lessons.length).toBe(1);

    const publishRes = await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/publish`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(publishRes.body.state).toBe('published');
    expect(publishRes.body.metrics.lessonCount).toBe(1);

    const publicRes = await request(app.getHttpServer())
      .get(`/api/v1/courses/${slug}`)
      .expect(200);
    expect(publicRes.body.state).toBe('published');
    expect(publicRes.body.sections[0].lessons[0].content).toBeNull();
    expect(publicRes.body.sections[0].lessons[0].videoId).toBeNull();
    expect(publicRes.body.sections[0].lessons[0].codeExercise.solutionCode).toBeNull();
  });
});

