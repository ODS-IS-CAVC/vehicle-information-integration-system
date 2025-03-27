import { Body, Controller, Get, HttpCode, InternalServerErrorException, Ip, NotFoundException, Post } from "@nestjs/common";
import { CurrentUser } from "../shares/role/role.decorator";
import { Roles } from "../shares/role/role.guard";
import { Users } from "src/entities/share/users.entity";
import { UserService } from "../user/user.service";
import { AuthLoginRequest, AuthRefreshResponseDto, AuthResponseDto } from "./dto/auth.dto";
import { AuthService } from "./auth.service";
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { BAD_REQUEST_MESSAGE, INTERNAL_SERVER_ERROR_MESSAGE, NOT_FOUND_MESSAGE } from "src/consts/openapi.const";
import { LoggerService } from "../util/logger/logger.service";

@ApiTags("C-2-2[B] 車両情報連携システム（データ流通システム取扱対象外）")
@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly userService: UserService,
    private readonly loggerService: LoggerService,
  ) {}

  @Post("/login")
  @HttpCode(201)
  @ApiOperation({
    summary: "C-2-2[B] ログイン認証",
    description: "ID/パスワードによりログイン処理を行います。データ流通システムのログインAPIとは異なるC-2-2[B]独自API",
  })
  @ApiResponse({ status: 201, description: "OK", type: AuthResponseDto })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiNotFoundResponse({ description: NOT_FOUND_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async login(@Body() body: AuthLoginRequest, @Ip() ip?: string) {
    try {
      const user = await this.userService.findUserByLoginIdAndPassword(body.loginId, body.password);
      this.loggerService.loginLog({
        userId: body.loginId,
        doLogin: !!user,
        sourceIp: ip || "",
      });

      if (!user) {
        this.loggerService.error(new NotFoundException());
        throw new NotFoundException();
      }
      return {
        token: await this.auth.createTokenByUser(user),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }

  @Roles("user")
  @HttpCode(201)
  @Get("/login")
  @ApiOperation({ summary: "トークン再取得" })
  @ApiResponse({ status: 201, description: "OK", type: AuthRefreshResponseDto })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiNotFoundResponse({ description: NOT_FOUND_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async reLogin(@CurrentUser() user: Users) {
    return {
      loginId: user.loginId,
      token: await this.auth.createTokenByUser(user),
    };
  }
}
