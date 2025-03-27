import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { Roles } from "../shares/role/role.guard";
import { UNAUTHORIZED_ERROR_MESSAGE } from "src/consts/openapi.const";
import { FacadeService } from "./facade.service";
import { FacadeResponseDto } from "./dto/facade-response.dto";

@Roles("user")
@ApiTags("C-2-2[B] 車両情報連携システム")
@Controller()
export class FacadeController {
  constructor(private readonly service: FacadeService) {}
  /**
   * 直接アクセス・ポイント情報取得
   * @returns 直接アクセス・ポイント情報取得
   */
  @Get("/facade")
  @ApiOperation({
    summary: "C-2-2[B] 直接アクセス・ポイント情報取得",
    description: "直接アクセス・ポイント情報データモデルのデータを取得します。",
  })
  @ApiResponse({ status: 200, description: "OK", type: FacadeResponseDto })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async facade() {
    const facade = this.service.facade();
    return facade;
  }
}
