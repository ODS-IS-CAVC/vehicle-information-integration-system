package com.nttdata.vehicleinfo.collection.targetinformationcollector.parser;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.invoke.MethodHandles;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** ユーザー認証のレスポンス解析 */
public class LoginResponseParser {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private String responseBody;
  private Map<String, String> responseMap;

  /**
   * 指定されたレスポンスボディで初期化して生成する。
   *
   * <p>レスポンスボディをJSONとして解析し、結果を設定する。
   *
   * @param responseBody レスポンスボディ
   * @throws RuntimeException レスポンスボディをJSONとして解析することに失敗した場合
   */
  public LoginResponseParser(String responseBody) {
    this.responseBody = responseBody;

    ObjectMapper objectMapper = new ObjectMapper();
    try {
      this.responseMap = objectMapper.readValue(responseBody, Map.class);
    } catch (Exception e) {
      throw new RuntimeException("解析失敗", e);
    }
  }

  /**
   * レスポンスボディを取得する。
   *
   * @return レスポンスボディ
   */
  public String getResponseBody() {
    return responseBody;
  }

  /**
   * accessTokenを取得する。
   *
   * @return accessToken
   */
  public String getAccessToken() {
    return responseMap.get("accessToken");
  }
}
