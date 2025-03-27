import { Module } from "@nestjs/common";
import { DmpJwtService } from "../shares/jwt/jwt.service";
import { SharesModule } from "../shares/shares.module";
import { UserModule } from "../user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LoggerService } from "../util/logger/logger.service";

@Module({
  imports: [UserModule, SharesModule],
  exports: [AuthService],
  providers: [AuthService, DmpJwtService, LoggerService],
  controllers: [AuthController],
})
export class AuthModule {}
