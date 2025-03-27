import { Test } from "@nestjs/testing";
import { SharesModule } from "../../shares/shares.module";
import { AuthController } from "../auth.controller";
import { AuthModule } from "../auth.module";
import { AuthService } from "../auth.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Users } from "src/entities/share/users.entity";

describe("AuthModule", () => {
  it("should compile the module", async () => {
    const module = await Test.createTestingModule({
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
        AuthModule,
      ],
      controllers: [],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(AuthController)).toBeInstanceOf(AuthController);
    expect(module.get(AuthService)).toBeInstanceOf(AuthService);
  });
});
