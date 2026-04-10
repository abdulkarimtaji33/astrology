import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const MAX_BODY = 800;
const MAX_RESPONSE = 2500;

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{ method: string; url: string; body?: unknown; query?: unknown; ip?: string }>();
    const { method, url, body, query, ip } = req;
    const start = Date.now();
    const reqId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    (req as { reqId?: string }).reqId = reqId;

    this.logger.log(
      `→ [${reqId}] ${method} ${url} query=${this.truncJson(query)} body=${this.truncJson(body)} ip=${ip ?? '?'}`,
    );

    return next.handle().pipe(
      tap((data) => {
        const ms = Date.now() - start;
        this.logger.log(`← [${reqId}] ${method} ${url} ${ms}ms OK ${this.truncResponse(data)}`);
      }),
    );
  }

  private truncJson(v: unknown): string {
    if (v == null) return '{}';
    try {
      const s = JSON.stringify(v);
      return s.length > MAX_BODY ? `${s.slice(0, MAX_BODY)}…(${s.length}b)` : s;
    } catch {
      return '(unserializable)';
    }
  }

  private truncResponse(data: unknown): string {
    if (data === undefined || data === null) return '(empty)';
    if (typeof data === 'string')
      return data.length > MAX_RESPONSE ? `${data.slice(0, MAX_RESPONSE)}…(${data.length}b)` : data;
    try {
      const s = JSON.stringify(data);
      return s.length > MAX_RESPONSE ? `${s.slice(0, MAX_RESPONSE)}…(${s.length} chars)` : s;
    } catch {
      return '(unserializable)';
    }
  }
}
