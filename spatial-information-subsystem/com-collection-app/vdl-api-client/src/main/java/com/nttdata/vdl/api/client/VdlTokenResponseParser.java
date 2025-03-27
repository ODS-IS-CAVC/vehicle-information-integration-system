package com.nttdata.vdl.api.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.invoke.MethodHandles;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** 仮想データレイクのトークン認証のレスポンス解析 */
public class VdlTokenResponseParser {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final String responseBody;
  private final Map<String, Object> responseMap;

  /**
   * 指定されたレスポンスボディで初期化して生成する。
   *
   * <p>レスポンスボディをJSONとして解析し、結果を設定する。
   *
   * @param responseBody レスポンスボディ
   * @throws RuntimeException レスポンスボディをJSONとして解析することに失敗した場合
   */
  public VdlTokenResponseParser(String responseBody) {
    this.responseBody = responseBody;

    ObjectMapper objectMapper = new ObjectMapper();
    try {
      this.responseMap = objectMapper.readValue(responseBody, Map.class);
    } catch (Exception e) {
      throw new RuntimeException("解析失敗", e);
    }
  }

  /**
   * レスポンスのBodyを返す。
   *
   * @return レスポンスのBody
   */
  public String getResponseBody() {
    return responseBody;
  }

  /**
   * アクセストークンを返す。
   *
   * @return アクセストークン
   */
  public String getAccessToken() {
    if (!responseMap.containsKey("access_token"))
      throw new IllegalStateException("access_tokenが存在しない");
    return String.valueOf(responseMap.get("access_token"));
  }

  /**
   * IDトークンを返す。
   *
   * @return IDトークン
   */
  public String getIdToken() {
    if (!responseMap.containsKey("id_token")) throw new IllegalStateException("id_tokenが存在しない");
    return String.valueOf(responseMap.get("id_token"));
  }
}
