import { Test, TestingModule } from "@nestjs/testing";
import { USER_TYPE } from "src/consts/user.const";
import { UserService } from "../user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Users } from "src/entities/share/users.entity";

describe("UserService", () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "database",
          port: 5432,
          username: "postgres",
          password: "postgres",
          database: "postgres",
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([Users]),
      ],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe("findOneByIdAndLoginId", () => {
    it("IDとログインIDに一致するユーザーが存在しない場合、nullが返却されること", async () => {
      const result = await service.findOneByIdAndLoginId(99, "user20");
      expect(result).toBeNull();
    });

    it("IDとログインIDに一致するユーザーが存在しない場合、該当のユーザー情報が返却されること", async () => {
      const result = await service.findOneByIdAndLoginId(8, "user8");
      expect(result).toMatchObject({
        id: 8,
        loginId: "user8",
        expireDate: "2099-12-31",
        userType: USER_TYPE.ADMIN,
      });
    });

    it("対象ユーザーが有効期限切れの場合も取得できること", async () => {
      const result = await service.findOneByIdAndLoginId(55, "user55");
      expect(result).toBeDefined();
    });
  });

  describe("findUserByLoginIdAndPassword", () => {
    it("ログインIDに一致するユーザーが存在しない場合、Nullが返却されること", async () => {
      const result = await service.findUserByLoginIdAndPassword("user21", "pass21");
      expect(result).toBeNull();
    });

    it("ログインIDに一致するユーザーが存在するがパスワードが異なる場合、Nullが返却されること", async () => {
      const result = await service.findUserByLoginIdAndPassword("user10", "pass12");
      expect(result).toBeNull();
    });

    it("ログインIDに一致するユーザーが存在するが有効期限がログイン日より前の場合、Nullが返却されること", async () => {
      const result = await service.findUserByLoginIdAndPassword("user11", "pass11");
      expect(result).toBeNull();
    });

    it("ログインIDに一致するユーザーが存在しパスワード・有効期限共に問題がない場合、ユーザー情報が返却されること", async () => {
      const result = await service.findUserByLoginIdAndPassword("user10", "pass10");
      expect(result).toEqual({
        id: 10,
        loginId: "user10",
        expireDate: "2099-12-31",
        userType: USER_TYPE.ADMIN,
      });
    });
  });
});
