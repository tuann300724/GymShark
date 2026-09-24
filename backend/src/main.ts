import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;

  // 1. Enable Global Prefix
  app.setGlobalPrefix('api');

  // 2. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 3. CORS Configuration
  app.enableCors({
    origin: [
      configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 4. Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gym Management & Operations API')
    .setDescription(
      'Hệ thống REST API quản lý hội viên và vận hành chuỗi phòng gym (Full-Stack Gym Management System). ' +
      'Bao gồm quản lý hội viên, huấn luyện viên (PT), gói tập, check-in, hoá đơn, thiết bị và báo cáo.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT Authorization',
        description: 'Nhập access token nhận được từ endpoint /api/auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Kiểm tra trạng thái máy chủ')
    .addTag('Authentication', 'Đăng nhập, đăng ký và xác thực JWT')
    .addTag('Users', 'Quản lý tài khoản người dùng và vai trò')
    .addTag('Members', 'Quản lý hồ sơ và thẻ hội viên phòng gym')
    .addTag('Trainers', 'Quản lý huấn luyện viên cá nhân (PT)')
    .addTag('Branches', 'Quản lý các chi nhánh phòng tập')
    .addTag('Membership Packages', 'Quản lý các gói tập gym')
    .addTag('Memberships', 'Quản lý các hợp đồng thẻ hội viên')
    .addTag('Check-ins', 'Quản lý lượt ra vào & quét thẻ check-in')
    .addTag('Payments', 'Quản lý giao dịch thu tiền và hoá đơn')
    .addTag('Training Schedules', 'Quản lý lịch tập và lớp học PT')
    .addTag('Promotions', 'Quản lý phiếu giảm giá và mã khuyến mãi')
    .addTag('Equipment', 'Quản lý thiết bị máy móc và lịch bảo trì')
    .addTag('Notifications', 'Quản lý thông báo hệ thống')
    .addTag('Reports', 'Báo cáo doanh thu & số liệu vận hành')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Gym Management API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`========================================================`);
  logger.log(`🚀 Backend REST API đang chạy tại: http://localhost:${port}/api`);
  logger.log(`📖 Swagger API Docs:               http://localhost:${port}/api/docs`);
  logger.log(`❤️  Healthcheck Endpoint:          http://localhost:${port}/api/health`);
  logger.log(`========================================================`);
}

bootstrap();
