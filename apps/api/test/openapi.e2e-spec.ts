import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { HealthController } from '../src/health/health.controller';
import { HealthService } from '../src/health/health.service';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { User, UserSchema } from '../src/users/schemas/user.schema';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { EducationController } from '../src/education/education.controller';
import { EducationService } from '../src/education/education.service';
import { EnrollmentService } from '../src/education/enrollment.service';
import { EducationMeController } from '../src/education/me.controller';
import { LessonsController } from '../src/education/lessons.controller';
import { Course, CourseSchema } from '../src/education/schemas/course.schema';
import { Category, CategorySchema } from '../src/education/schemas/category.schema';
import { Enrollment, EnrollmentSchema } from '../src/education/schemas/enrollment.schema';
import { MarketplaceSellersController } from '../src/marketplace/marketplace-sellers.controller';
import { MarketplaceMeController } from '../src/marketplace/marketplace-me.controller';
import { MarketplaceAdminSellersController } from '../src/marketplace/marketplace-admin-sellers.controller';
import { MarketplaceAdminSettingsController } from '../src/marketplace/marketplace-admin-settings.controller';
import { MarketplaceAdminOfferingsController } from '../src/marketplace/marketplace-admin-offerings.controller';
import { MarketplacePublicOfferingsController } from '../src/marketplace/marketplace-public-offerings.controller';
import { MarketplacePublicSellersController } from '../src/marketplace/marketplace-public-sellers.controller';
import { MarketplaceSellersService } from '../src/marketplace/marketplace-sellers.service';
import { MarketplaceSettingsService } from '../src/marketplace/marketplace-settings.service';
import { MarketplaceOfferingsService } from '../src/marketplace/marketplace-offerings.service';
import { MarketplaceAssetsService } from '../src/marketplace/marketplace-assets.service';
import { MarketplacePublicService } from '../src/marketplace/marketplace-public.service';
import { SellerProfile, SellerProfileSchema } from '../src/marketplace/schemas/seller-profile.schema';
import { Offering, OfferingSchema } from '../src/marketplace/schemas/offering.schema';
import { DigitalAsset, DigitalAssetSchema } from '../src/marketplace/schemas/digital-asset.schema';
import { MarketplaceSettings, MarketplaceSettingsSchema } from '../src/marketplace/schemas/marketplace-settings.schema';
import { StorageService } from '../src/storage/storage.service';

describe('OpenAPI document (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test_jwt_secret';
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET ?? 'test_refresh_secret';

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
          { name: SellerProfile.name, schema: SellerProfileSchema },
          { name: Offering.name, schema: OfferingSchema },
          { name: DigitalAsset.name, schema: DigitalAssetSchema },
          { name: MarketplaceSettings.name, schema: MarketplaceSettingsSchema },
        ]),
      ],
      controllers: [
        HealthController,
        UsersController,
        AuthController,
        EducationController,
        EducationMeController,
        LessonsController,
        MarketplaceSellersController,
        MarketplaceMeController,
        MarketplaceAdminSellersController,
        MarketplaceAdminSettingsController,
        MarketplaceAdminOfferingsController,
        MarketplacePublicOfferingsController,
        MarketplacePublicSellersController,
      ],
      providers: [
        HealthService,
        UsersService,
        AuthService,
        JwtStrategy,
        EducationService,
        EnrollmentService,
        MarketplaceSellersService,
        MarketplaceSettingsService,
        MarketplaceOfferingsService,
        MarketplaceAssetsService,
        MarketplacePublicService,
        StorageService,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongo.stop();
  });

  it('includes Auth, Users, Education and Marketplace endpoints', () => {
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
    expect(paths.some((p) => p.startsWith('/api/v1/auth'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/api/v1/users'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/api/v1/courses'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/api/v1/me'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/api/v1/lessons'))).toBe(true);
    expect(paths.some((p) => p.includes('/courses/{id}/enroll'))).toBe(true);
    expect(paths.some((p) => p.includes('/courses/{id}/lessons'))).toBe(true);
    expect(paths.includes('/api/v1/me/instructor/courses')).toBe(true);
    expect(paths.includes('/api/v1/sellers/apply')).toBe(true);
    expect(paths.includes('/api/v1/me/seller')).toBe(true);
    expect(paths.includes('/api/v1/admin/sellers')).toBe(true);
    expect(paths.includes('/api/v1/admin/sellers/{id}/approve')).toBe(true);
    expect(paths.includes('/api/v1/admin/sellers/{id}/reject')).toBe(true);
    expect(paths.includes('/api/v1/admin/settings')).toBe(true);
    expect(paths.includes('/api/v1/admin/settings/commission')).toBe(true);
    expect(paths.includes('/api/v1/me/seller/offerings')).toBe(true);
    expect(paths.includes('/api/v1/me/seller/offerings/{id}')).toBe(true);
    expect(paths.includes('/api/v1/me/seller/offerings/{id}/submit')).toBe(true);
    expect(paths.includes('/api/v1/me/seller/offerings/{id}/asset/upload-url')).toBe(true);
    expect(paths.includes('/api/v1/me/seller/offerings/{id}/asset')).toBe(true);
    expect(paths.includes('/api/v1/admin/offerings')).toBe(true);
    expect(paths.includes('/api/v1/admin/offerings/{id}/approve')).toBe(true);
    expect(paths.includes('/api/v1/admin/offerings/{id}/reject')).toBe(true);
    expect(paths.includes('/api/v1/offerings')).toBe(true);
    expect(paths.includes('/api/v1/offerings/{slug}')).toBe(true);
    expect(paths.includes('/api/v1/sellers/{id}')).toBe(true);

    const lessonSchema = doc.components?.schemas?.LessonDto as any;
    expect(lessonSchema?.properties?.lessonProgress).toBeDefined();
  });
});

