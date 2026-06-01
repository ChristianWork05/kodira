import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { EMAIL_QUEUE } from '../src/auth/emails/emails.constants';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { User, UserSchema } from '../src/users/schemas/user.schema';

describe('Auth + Users (e2e in-memory)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
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
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      controllers: [AuthController, UsersController],
      providers: [
        UsersService,
        AuthService,
        JwtStrategy,
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
        exceptionFactory: (errors) =>
          ApiExceptionFilter.validationException(errors),
      }),
    );
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongo.stop();
  });

  it('register -> users/me -> refresh -> logout', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'user@mail.com',
        password: 'password1',
        username: 'kodi_dev',
        fullName: 'Kodi Dev',
      })
      .expect(201);

    expect(registerRes.body.tokens.accessToken).toBeTruthy();
    expect(registerRes.body.tokens.refreshToken).toBeTruthy();
    expect(registerRes.body.user.email).toBe('user@mail.com');
    expect(emailQueue.add).toHaveBeenCalled();

    const accessToken = registerRes.body.tokens.accessToken as string;
    const refreshToken = registerRes.body.tokens.refreshToken as string;

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meRes.body.email).toBe('user@mail.com');
    expect(meRes.body.username).toBe('kodi_dev');

    const jwtService = app.get(JwtService);
    const misusedRefreshToken = await jwtService.signAsync(
      { sub: registerRes.body.user.id, type: 'refresh' },
      { secret: 'test_jwt_secret', expiresIn: '30d' },
    );
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${misusedRefreshToken}`)
      .expect(401);

    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(refreshRes.body.accessToken).toBeTruthy();
    expect(refreshRes.body.refreshToken).toBeTruthy();

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });
});

