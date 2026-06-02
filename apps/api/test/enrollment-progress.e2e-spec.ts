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
import { Enrollment, EnrollmentSchema } from '../src/education/schemas/enrollment.schema';
import { EnrollmentService } from '../src/education/enrollment.service';
import { EducationMeController } from '../src/education/me.controller';
import { LessonsController } from '../src/education/lessons.controller';
import { CERTIFICATE_QUEUE } from '../src/education/queues/certificates.constants';

describe('Enrollments + Progress (e2e in-memory)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let categoryModel: Model<Category>;
  let usersService: UsersService;
  const emailQueue = { add: jest.fn() };
  const certificateQueue = { add: jest.fn() };

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
          { name: Enrollment.name, schema: EnrollmentSchema },
        ]),
      ],
      controllers: [
        AuthController,
        EducationController,
        EducationMeController,
        LessonsController,
      ],
      providers: [
        UsersService,
        AuthService,
        JwtStrategy,
        EducationService,
        EnrollmentService,
        { provide: EMAIL_QUEUE, useValue: emailQueue },
        { provide: CERTIFICATE_QUEUE, useValue: certificateQueue },
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

  it('enrolls a free course, gates lessons, stores progress and completes at 100%', async () => {
    const category = await categoryModel.create({
      name: 'Backend',
      slug: 'backend',
      icon: 'code',
      order: 1,
    });

    const instructorRegister = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'inst@mail.com',
        password: 'password1',
        username: 'instructor_owner',
        fullName: 'Instructor Owner',
      })
      .expect(201);
    const instructorId = instructorRegister.body.user.id as string;
    await usersService.addRole(instructorId, 'instructor');
    const instructorToken = instructorRegister.body.tokens.accessToken as string;

    const courseCreate = await request(app.getHttpServer())
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Curso Gratis',
        level: 'beginner',
        language: 'es',
        price: 0,
        discountPrice: null,
        isFree: true,
        thumbnailUrl: 'https://example.com/thumb.png',
        categoryId: category._id.toString(),
      })
      .expect(201);
    const courseId = courseCreate.body.id as string;

    const sectionAdded = await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/sections`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Sección 1' })
      .expect(201);
    const sectionId = sectionAdded.body.sections[0].id as string;

    const lessonAdded = await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/sections/${sectionId}/lessons`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Lección 1',
        type: 'text',
        isFreePreview: false,
        content: 'contenido completo',
      })
      .expect(201);
    const lessonId = lessonAdded.body.sections[0].lessons[0].id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/publish`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .expect(200);

    const studentRegister = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'student@mail.com',
        password: 'password1',
        username: 'student_1',
        fullName: 'Student One',
      })
      .expect(201);
    const studentToken = studentRegister.body.tokens.accessToken as string;

    const otherStudentRegister = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'student2@mail.com',
        password: 'password1',
        username: 'student_2',
        fullName: 'Student Two',
      })
      .expect(201);
    const otherStudentToken = otherStudentRegister.body.tokens.accessToken as string;

    const lessonsBefore = await request(app.getHttpServer())
      .get(`/api/v1/courses/${courseId}/lessons`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(lessonsBefore.body.sections[0].lessons[0].content).toBeNull();

    await request(app.getHttpServer())
      .post(`/api/v1/lessons/${lessonId}/progress`)
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({ watchPercentage: 10, lastPositionSeconds: 10 })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/lessons/${lessonId}/complete`)
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .expect(403);

    const enrolled = await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(201);
    expect(enrolled.body.courseId).toBe(courseId);

    const lessonsAfter = await request(app.getHttpServer())
      .get(`/api/v1/courses/${courseId}/lessons`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(lessonsAfter.body.sections[0].lessons[0].content).toBe('contenido completo');

    await request(app.getHttpServer())
      .post(`/api/v1/lessons/${lessonId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ watchPercentage: 50, lastPositionSeconds: 120 })
      .expect(200);

    const completed = await request(app.getHttpServer())
      .post(`/api/v1/lessons/${lessonId}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(completed.body.progressPercentage).toBe(100);
    expect(completed.body.isCompleted).toBe(true);
    expect(certificateQueue.add).toHaveBeenCalled();

    const myCourses = await request(app.getHttpServer())
      .get('/api/v1/me/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(myCourses.body.items.length).toBe(1);
    expect(myCourses.body.items[0].enrollment.progressPercentage).toBe(100);
    expect(myCourses.body.items[0].lastLessonId).toBe(lessonId);
  });
});

