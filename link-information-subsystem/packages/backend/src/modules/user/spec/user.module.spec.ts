import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Users } from "src/entities/share/users.entity";
import { UserModule } from "../user.module";
import { SharesModule } from "src/modules/shares/shares.module";
import { UserController } from "../user.controller";
import { UserService } from "../user.service";

describe("UserModule", () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
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
        SharesModule,
        UserModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it("should compile the module", async () => {
    expect(module).toBeDefined();
    expect(module.get(UserController)).toBeInstanceOf(UserController);
    expect(module.get(UserService)).toBeInstanceOf(UserService);
  });
});
