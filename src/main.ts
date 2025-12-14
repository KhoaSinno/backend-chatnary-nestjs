import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './response.interceptor';
import { HttpExceptionFilter } from './http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Chatnary API')
    .setDescription('The Chatnary API description')
    .setVersion('1.0')
    .addTag('chatnary')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  // -- Response interceptor --
  app.useGlobalInterceptors(new ResponseInterceptor());
  // -- HTTP exception filter --
  app.useGlobalFilters(new HttpExceptionFilter());
  // -- Prefix all routes with /api/v1 --
  app.setGlobalPrefix('api/v1');
  // -- Swagger setup --
  SwaggerModule.setup('api/v1/docs', app, documentFactory);
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
