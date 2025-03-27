import { Module } from "@nestjs/common";
import { FacadeController } from "./facade.controller";
import { FacadeService } from "./facade.service";

@Module({
  imports: [],
  controllers: [FacadeController],
  providers: [FacadeService],
})
export class FacadeModule {}
