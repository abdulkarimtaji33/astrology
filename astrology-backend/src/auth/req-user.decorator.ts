import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Use after JwtAuthGuard — user from JWT strategy validate() */
export const ReqUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<{ user: { id: number; email: string } }>();
  return req.user;
});
