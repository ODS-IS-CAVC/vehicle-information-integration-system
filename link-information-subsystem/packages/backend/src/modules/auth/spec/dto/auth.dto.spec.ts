import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { AuthLoginRequest, AuthRefreshResponseDto, AuthResponseDto } from "../../dto/auth.dto";

describe("auth.dto", () => {
  describe("AuthLoginRequest", () => {
    it("リクエスト内容のログインIDが存在しない場合、エラーになること", async () => {
      const request = {
        password: "test",
      };
      const dto = plainToInstance(AuthLoginRequest, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
    it("リクエスト内容のパスワードが存在しない場合、エラーになること", async () => {
      const request = {
        loginId: "test",
      };
      const dto = plainToInstance(AuthLoginRequest, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
    it("リクエスト内容のログインIDとパスワードが存在する場合、エラーにならないこと", async () => {
      const request = {
        loginId: "test",
        password: "test",
      };
      const dto = plainToInstance(AuthLoginRequest, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
  describe("AuthResponseDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(AuthResponseDto, request);
      expect(dto).toBeDefined();
    });
  });
  describe("AuthRefreshResponseDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(AuthRefreshResponseDto, request);
      expect(dto).toBeDefined();
    });
  });
});
