import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { HttpLoggingInterceptor } from './common/http-logging.interceptor';

process.on('uncaughtException', (err) => {
  console.error('[CRASH] uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRASH] unhandledRejection:', reason);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
  app.useGlobalInterceptors(new HttpLoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const port = process.env.PORT || 6000;
  await app.listen(port);
  const httpServer = app.getHttpServer() as import('node:http').Server;
  const tenMin = 10 * 60 * 1000;
  httpServer.setTimeout(tenMin);
  httpServer.headersTimeout = tenMin;
  httpServer.requestTimeout = tenMin;
  console.log(`Listening on ${port} (HTTP timeouts ${tenMin}ms)`);
}
bootstrap();
