import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AuthLoginRequest {
  @ApiProperty({
    description: "ログインID",
    format: "string",
  })
  @IsNotEmpty()
  @IsString()
  loginId: string;

  @ApiProperty({
    description: "パスワード",
    format: "string",
  })
  @IsNotEmpty()
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: "アクセストークン",
    format: "string",
  })
  token: string;
}

export class AuthRefreshResponseDto {
  @ApiProperty({
    description: "ログインID",
    format: "string",
  })
  loginId: string;
  @ApiProperty({
    description: "アクセストークン",
    format: "string",
  })
  token: string;
}
