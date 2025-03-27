import { Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { JWT_EXPIRE_IN, JWT_SECRET_KEY } from "src/consts/auth.const";

@Injectable({})
export class DmpJwtService {
  private service: JwtService;

  constructor() {
    this.service = new JwtService({
      secret: JWT_SECRET_KEY(),
      signOptions: {
        expiresIn: JWT_EXPIRE_IN(),
      },
    });
  }

  signAsync(payload: object, options: JwtSignOptions = {}) {
    return this.service.signAsync(payload, {
      ...options,
    });
  }

  verifyAsync(token: string) {
    return this.service.verifyAsync(token);
  }
}
