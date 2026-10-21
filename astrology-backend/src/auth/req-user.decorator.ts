import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedUser } from './jwt.strategy';

/** Use after JwtAuthGuard — user from JWT strategy validate() */
export const ReqUser = createParamDecorator((data: unknown, ctx: ExecutionContext): AuthedUser => {
  const req = ctx.switchToHttp().getRequest<{ user: AuthedUser }>();
  return req.user;
});
