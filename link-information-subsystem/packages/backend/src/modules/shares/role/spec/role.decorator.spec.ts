import { createMock } from "@golevelup/ts-jest";
import { ExecutionContext } from "@nestjs/common";
import { userFactory } from "../role.decorator";
import { Users } from "src/entities/share/users.entity";

describe("RoleDecorator", () => {
  describe("userFactory", () => {
    let mockContext: any;
    beforeEach(() => {
      mockContext = createMock<ExecutionContext>();
    });

    it("reqにユーザー情報が格納されている場合、ユーザー情報が返却されること", () => {
      const user = new Users();
      user.loginId = "login123";

      mockContext.switchToHttp().getRequest.mockReturnValue({ user: user });
      const result = userFactory(null, mockContext);
      expect(result).toEqual(user);
    });

    it("reqにユーザー情報が格納されていない場合、Nullが返却されること", () => {
      mockContext.switchToHttp().getRequest.mockReturnValue({ user: null });

      const result = userFactory(null, mockContext);
      expect(result).toBeNull();
    });
  });
});
