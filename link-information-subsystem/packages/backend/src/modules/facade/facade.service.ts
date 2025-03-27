import { Injectable } from "@nestjs/common";
import { FACADE_URL } from "src/consts/facade.const";

@Injectable()
export class FacadeService {
  /**
   * 直接アクセス・ポイント情報取得
   * @returns 直接アクセス・ポイント情報
   */
  facade() {
    const result = {
      dataModelType: "test1",
      attribute: {
        url: FACADE_URL(),
      },
    };
    return result;
  }
}
