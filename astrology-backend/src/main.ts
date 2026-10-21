import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
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
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
  // The API sits behind the Next proxy (and nginx in production): trust X-Forwarded-* for client IP/proto.
  app.set('trust proxy', process.env.TRUST_PROXY ?? 'loopback');
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalInterceptors(new HttpLoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
  // Browsers only talk to the same-origin Next proxy, so CORS is closed unless origins are listed.
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : false, credentials: true });
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
