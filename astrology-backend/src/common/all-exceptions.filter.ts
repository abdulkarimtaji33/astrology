import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('HTTP');

  constructor(adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<{ method: string; url: string; reqId?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rid = req.reqId ? `[${req.reqId}] ` : '';
    const payload =
      exception instanceof HttpException ? exception.getResponse() : exception instanceof Error ? exception.message : String(exception);
    const msg = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);

    this.logger.error(
      `${rid}EXCEPTION ${req.method} ${req.url} → ${status} ${msg}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    super.catch(exception, host);
  }
}
