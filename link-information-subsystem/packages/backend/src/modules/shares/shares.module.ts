import { Module } from "@nestjs/common";
import { DmpJwtService } from "./jwt/jwt.service";

@Module({
  imports: [],
  providers: [DmpJwtService],
  exports: [DmpJwtService],
})
export class SharesModule {}
