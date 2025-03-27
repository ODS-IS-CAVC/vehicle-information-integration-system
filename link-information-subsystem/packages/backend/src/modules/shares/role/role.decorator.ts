import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const userFactory = (_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
};
export const CurrentUser = createParamDecorator(userFactory);
