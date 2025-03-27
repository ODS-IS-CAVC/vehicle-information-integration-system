package com.nttdata.vehicleinfo.collection.targetinformationcollector.parser;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.invoke.MethodHandles;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Tier4のTargetInfoApiのtargetInfoのレスポンス解析 */
public class TargetInfoResponseParser {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private String responseBody;

  private Map<String, Object> responseMap;

  /**
   * 指定されたレスポンスボディで初期化して生成する。
   *
   * <p>レスポンスボディをJSONとして解析して結果を設定する。
   *
   * @param responseBody レスポンスボディ
   * @throws RuntimeException レスポンスボディをJSONとして解析することに失敗した場合
   */
  public TargetInfoResponseParser(String responseBody) {
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
}
