package com.nttdata.vehicleinfo.collection.weatherinformationcollector.parser;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.invoke.MethodHandles;
import java.text.MessageFormat;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** ハレックス社のDreamAPIの72時間dataのレスポンス解析 */
public class Wimage72ResponseParser {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private String responseBody;

  /** バージョン（YYYYMMDDHH00形式） */
  private String version;

  private Map<String, Object> responseMap;

  /**
   * 指定されたレスポンスボディで初期化して生成する。
   *
   * <p>レスポンスボディをJSONとして解析して結果を設定する。
   *
   * <p>JSONとして解析した結果からバージョンを取得して設定する。もしバージョンが取得できない場合は「UNKNOWN」を設定する。
   *
   * @param responseBody レスポンスボディ
   * @throws RuntimeException レスポンスボディをJSONとして解析することに失敗した場合
   */
  public Wimage72ResponseParser(String responseBody) {
    this.responseBody = responseBody;

    ObjectMapper objectMapper = new ObjectMapper();
    try {
      this.responseMap = objectMapper.readValue(responseBody, Map.class);
      this.version = parseVersion();
    } catch (Exception e) {
      throw new RuntimeException("解析失敗", e);
    }
  }

  /**
   * レスポンスボディを返す。
   *
   * @return レスポンスボディ
   */
  public String getResponseBody() {
    return responseBody;
  }

  /**
   * バージョンを返す。
   *
   * @return バージョン
   */
  public String getVersion() {
    return version;
  }

  /**
   * ForecastPrecipitaitonを返す。
   *
   * @return ForecastPrecipitaiton
   */
  public List<Map<String, Object>> getForecastPrecipitaiton() {
    return (List<Map<String, Object>>) this.responseMap.get("ForecastPrecipitaiton");
  }

  /**
   * エラーを返す。
   *
   * <p>取得できない場合は空文字を返す。
   *
   * @return エラー
   */
  public String getError() {
    return (String) this.responseMap.getOrDefault("error", "");
  }

  /**
   * リトライ可能なエラーかどうかを返す。
   *
   * @return リトライ可能な場合はtrue
   */
  public boolean isRetryableError() {
    /* 「02_72時間data.pdf」P7より引用
     *
     * No エラーコード エラーの内容
     * 1 ERR-014 APIセンターサーバ側内部にて例外等の事象発生
     * 2 ERR-101 省略不可リクエストパラメータ不足
     * 3 ERR-102 リクエストパラメータの入力エラー(数値以外の指定の場合)
     * 4 ERR-106 リクエストパラメータの入力エラー(指定範囲外の数値が入力されている場合)
     * 5 ERU-001 key指定エラー
     * 6 ERU-002 keyの有効期限切れ
     * 7 ERU-003 サービス指定エラー(sid=wimage-serviceが正しく入力されていない場合)
     */
    // ERR-014のみリトライ可能
    return getError().startsWith("ERR-014");
  }

  /**
   * レスポンスがエラーかどうかを返す。
   *
   * @return エラーの場合はtrue
   */
  public boolean isError() {
    return !getError().isEmpty();
  }

  /**
   * バージョンが一致しているかどうかを返す。
   *
   * @param version バージョン
   * @return 一致している場合はtrue
   */
  public boolean isVersionEqual(String version) {
    return getVersion().equals(version);
  }

  String parseVersion() {
    try {
      if (isError()) return "UNKNOWN";
      // ForecastPrecipitaitonの1件目のdtfの開始をバージョンとする
      // 以下、理由。
      // ・必ず1件目にデータが入っている
      // ・実行日時の年月日時00分と一致する
      String dtf = (String) getForecastPrecipitaiton().getFirst().get("dtf");
      return dtf.split("-")[0];
    } catch (Exception e) {
      String msg = MessageFormat.format("バージョンの取得失敗: responseBody={0}", responseBody);
      logger.warn(msg, e);
      // 処理は続行する
      return "UNKNOWN";
    }
  }
}
