package com.nttdata.vehicleinfo.collection.weatherinformationcollector.test;

import com.nttdata.vdl.api.client.VdlApiConfig;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.config.DreamApiConfig;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.MessageFormat;
import java.util.concurrent.TimeUnit;
import org.mockserver.model.Delay;
import org.mockserver.model.HttpRequest;
import org.mockserver.model.HttpResponse;

public class MockServerTestHelper {
  public static class CustomProperties {
    // テスト用のプロパティ（主にendpoint)にMockServerを設定する際に利用する。
    // プロパティに${mockServerPort}を指定することでポート番号を設定できる。
    // https://www.mock-server.com/mock_server/running_mock_server.html#spring_test_exec_listener

    // Usage:
    // @MockServerTest({
    //   CustomProperties.HALEX_DREAM_API_WIMAGE72_REQUEST_ENDPOINT,
    //   CustomProperties.VDL_API_TOKEN_REQUEST_ENDPOINT,
    //   CustomProperties.VDL_API_DATA_REQUEST_ENDPOINT
    // })
    public static final String HALEX_DREAM_API_WIMAGE72_REQUEST_ENDPOINT =
        "halex.dream-api.wimage72.request.endpoint=http://localhost:${mockServerPort}/wimage/hpd";

    public static final String VDL_API_TOKEN_REQUEST_ENDPOINT =
        "vdl.api.token.request.endpoint=http://localhost:${mockServerPort}/realms/vdl/protocol/openid-connect/token";

    public static final String VDL_API_DATA_REQUEST_ENDPOINT =
        "vdl.api.data.request.endpoint=http://localhost:${mockServerPort}/api/v1/data";
  }

  public static HttpRequest getWimage72Request(DreamApiConfig dreamApiConfig) {
    try {
      String endpoint =
          URI.create(dreamApiConfig.wimage72().request().endpoint()).toURL().getPath();
      return HttpRequest.request().withMethod("GET").withPath(endpoint);
    } catch (MalformedURLException e) {
      throw new RuntimeException(e);
    }
  }

  public static HttpRequest getWimage72RequestWithQuery(DreamApiConfig dreamApiConfig) {
    try {
      String endpoint =
          URI.create(dreamApiConfig.wimage72().request().endpoint()).toURL().getPath();
      // 設定ファイルからパラメータを取得
      DreamApiConfig.Wimage72.Request.Parameters p =
          dreamApiConfig.wimage72().request().parameters();
      return HttpRequest.request()
          .withMethod("GET")
          .withPath(endpoint)
          // withQueryStringParameter()で指定したGETパラメータが含まれている場合のみマッチする
          .withQueryStringParameter("key", dreamApiConfig.key())
          .withQueryStringParameter("sid", p.sid())
          .withQueryStringParameter("rem", p.rem())
          .withQueryStringParameter("proj", p.proj());
    } catch (MalformedURLException e) {
      throw new RuntimeException(e);
    }
  }

  public static final String RESPONSE_OK_TARGET_DATE_TIME =
      Wimage72ResponseParserTestHelper.TARGET_DATE_TIME_202409040000;
  public static final String RESPONSE_OK_FILE_NAME =
      Wimage72ResponseParserTestHelper.FILE_NAME_202409040000_1;

  public static HttpResponse getWimage72ResponseOk() {
    String body =
        Wimage72ResponseParserTestHelper.getWimage72Response202409040000().getResponseBody();
    return HttpResponse.response().withStatusCode(200).withBody(body);
  }

  /**
   * 対象日時を置換したOKのレスポンスを返す
   *
   * @param oldFormattedTargetDateTime 置換前の対象日時
   * @param newFormattedTargetDateTime 置換後の対象日時
   * @return 対象日時を置換したOKのレスポンス
   */
  public static HttpResponse getWimage72ResponseOk(
      String oldFormattedTargetDateTime, String newFormattedTargetDateTime) {
    String body =
        Wimage72ResponseParserTestHelper.getWimage72Response202409040000().getResponseBody();
    return HttpResponse.response()
        .withStatusCode(200)
        .withBody(body.replace(oldFormattedTargetDateTime, newFormattedTargetDateTime));
  }

  public static HttpResponse getWimage72ResponseOkRetryableError() {
    // ステータスコードはOK、かつ、リトライ可能なエラーコード
    String body =
        Wimage72ResponseParserTestHelper.getWimage72ResponseRetryableError().getResponseBody();
    return HttpResponse.response().withStatusCode(200).withBody(body);
  }

  public static HttpResponse getWimage72ResponseOkError() {
    // ステータスコードはOK、かつ、リトライ不可なエラーコード
    String body = Wimage72ResponseParserTestHelper.getWimage72ResponseError().getResponseBody();
    return HttpResponse.response().withStatusCode(200).withBody(body);
  }

  public static HttpResponse getWimage72ResponseNg() {
    return HttpResponse.response().withStatusCode(500);
  }

  public static HttpResponse getWimage72ResponseRetryableStatusCode() {
    // ステータスコードがOK以外はリトライする
    return getWimage72ResponseNg();
  }

  public static HttpResponse getWimage72ResponseWaitRequestTimeout(DreamApiConfig dreamApiConfig) {
    // HTTPリクエストがタイムアウトするまで待つ
    Delay delay =
        Delay.delay(TimeUnit.NANOSECONDS, dreamApiConfig.wimage72().request().timeoutNanos() * 2);
    return HttpResponse.response().withDelay(delay).withStatusCode(200);
  }

  public static HttpRequest getVdlAuthRequest(VdlApiConfig vdlApiConfig) {
    try {

      StringBuilder bodyBuilder = new StringBuilder();
      VdlApiConfig.Token.Request.Parameters p = vdlApiConfig.token().request().parameters();
      bodyBuilder.append("client_id=").append(p.clientId()).append("&");
      bodyBuilder.append("client_secret=").append(p.clientSecret()).append("&");
      bodyBuilder.append("username=").append(p.username()).append("&");
      bodyBuilder.append("password=").append(p.password()).append("&");
      bodyBuilder.append("grant_type=").append(p.grantType()).append("&");
      bodyBuilder.append("scope=").append(p.scope());

      String endpoint = URI.create(vdlApiConfig.token().request().endpoint()).toURL().getPath();
      return HttpRequest.request()
          .withMethod("POST")
          .withPath(endpoint)
          // withHeader()で指定したヘッダーが含まれている場合のみマッチする
          .withHeader("Content-Type", "application/x-www-form-urlencoded")
          // withBody()で指定したBodyが含まれている場合のみマッチする
          .withBody(bodyBuilder.toString());
    } catch (MalformedURLException e) {
      throw new RuntimeException(e);
    }
  }

  public static HttpResponse getVdlAuthResponseOk() {
    String body =
        """
            {
              "access_token": "access_token",
              "expires_in": 300,
              "refresh_expires_in": 1800,
              "refresh_token": "refresh_token",
              "token_type": "Bearer",
              "id_token": "id_token",
              "not-before-policy": 0,
              "session_state": "session_state",
              "scope": "scope"
            }
            """;
    return HttpResponse.response().withStatusCode(200).withBody(body);
  }

  public static HttpResponse getVdlAuthResponseNg() {
    // 200以外はNG
    return HttpResponse.response().withStatusCode(500);
  }

  public static HttpRequest getVdlDataRequestGet(
      VdlApiConfig vdlApiConfig, String formattedTargetDateTime, String fileName) {

    URI vdlPathUri = getVdlPathUri(vdlApiConfig, formattedTargetDateTime, fileName);
    return HttpRequest.request()
        .withMethod("GET")
        .withPath(vdlPathUri.getPath())
        // withHeader()で指定したヘッダーが含まれている場合のみマッチする
        .withHeader("Content-Type", "application/json")
        .withHeader("X-Authentication-ID_TOKEN", "id_token") // getVdlAuthResponseOk()のbodyと合わせる
        .withHeader("Authorization", "Bearer access_token"); // getVdlAuthResponseOk()のbodyと合わせる
  }

  public static HttpResponse getVdlDataResponseGetOk() {
    String body = "getVdlDataResponseGetOk";
    return HttpResponse.response().withStatusCode(200).withBody(body);
  }

  public static HttpResponse getVdlDataResponseGetNg() {
    // GETは2xxはOK、それ以外はNG
    return HttpResponse.response().withStatusCode(500);
  }

  public static HttpRequest getVdlDataRequestPostTestData(
      VdlApiConfig vdlApiConfig, String formattedTargetDateTime, String fileName) {
    // リソースのファイルでマッチさせる
    byte[] fileBytes;
    try {
      fileBytes =
          Files.readAllBytes(
              Wimage72ResponseParserTestHelper.getResourceDataDirAsPath(
                  formattedTargetDateTime, fileName));
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
    return getVdlDataRequestPost(vdlApiConfig, formattedTargetDateTime, fileName, fileBytes);
  }

  public static HttpRequest getVdlDataRequestPost(
      VdlApiConfig vdlApiConfig,
      String formattedTargetDateTime,
      String fileName,
      byte[] fileBytes) {
    URI vdlPathUri = getVdlPathUri(vdlApiConfig, formattedTargetDateTime, fileName);
    return HttpRequest.request()
        .withMethod("POST")
        .withPath(vdlPathUri.getPath())
        // withHeader()で指定したヘッダーが含まれている場合のみマッチする
        .withHeader("Content-Type", "application/octet-stream")
        .withHeader("X-Authentication-ID_TOKEN", "id_token") // getVdlAuthResponseOk()のbodyと合わせる
        .withHeader("Authorization", "Bearer access_token") // getVdlAuthResponseOk()のbodyと合わせる
        // withBody()で指定したBodyが含まれている場合のみマッチする
        .withBody(fileBytes);
  }

  public static HttpRequest getVdlDataRequestPostAnyVdlPathAnyBody(VdlApiConfig vdlApiConfig) {
    // VdlPathとBodyは何でもよい
    URI vdlPathUri = getVdlPathBaseUri(vdlApiConfig);
    return HttpRequest.request()
        .withMethod("POST")
        // VdlPathは何でもよい
        .withPath(vdlPathUri.getPath() + ".*")
        // withHeader()で指定したヘッダーが含まれている場合のみマッチする
        .withHeader("Content-Type", "application/octet-stream")
        .withHeader("X-Authentication-ID_TOKEN", "id_token") // getVdlAuthResponseOk()のbodyと合わせる
        .withHeader("Authorization", "Bearer access_token"); // getVdlAuthResponseOk()のbodyと合わせる
  }

  public static HttpResponse getVdlDataResponsePostCreated201() {
    return HttpResponse.response().withStatusCode(201);
  }

  public static HttpResponse getVdlDataResponsePostConflict409() {
    return HttpResponse.response().withStatusCode(409);
  }

  public static HttpRequest getVdlDataRequestPostNg(
      VdlApiConfig vdlApiConfig, String formattedTargetDateTime, String fileName) {
    // POSTに失敗するときのリクエストのためヘッダやボディは何でも良い
    URI vdlPathUri = getVdlPathUri(vdlApiConfig, formattedTargetDateTime, fileName);
    return HttpRequest.request().withMethod("POST").withPath(vdlPathUri.getPath());
  }

  public static HttpResponse getVdlDataResponsePostNg() {
    // Postは2xxと409はOK、それ以外はNG
    return HttpResponse.response().withStatusCode(500);
  }

  public static HttpRequest getVdlDataRequestDelete(
      VdlApiConfig vdlApiConfig, String formattedTargetDateTime, String fileName) {
    URI vdlPathUri = getVdlPathUri(vdlApiConfig, formattedTargetDateTime, fileName);
    return HttpRequest.request()
        .withMethod("DELETE")
        .withPath(vdlPathUri.getPath())
        // withHeader()で指定したヘッダーが含まれている場合のみマッチする
        .withHeader("X-Authentication-ID_TOKEN", "id_token") // getVdlAuthResponseOk()のbodyと合わせる
        .withHeader("Authorization", "Bearer access_token"); // getVdlAuthResponseOk()のbodyと合わせる
  }

  public static HttpResponse getVdlDataResponseDeleteDeleted204() {
    return HttpResponse.response().withStatusCode(204);
  }

  public static HttpResponse getVdlDataResponseDeleteNg() {
    // Deleteは2xxはOK、それ以外はNG
    return HttpResponse.response().withStatusCode(500);
  }

  public static URI getVdlPathBaseUri(VdlApiConfig vdlApiConfig) {
    // 設定ファイルの末尾のスラッシュの有無に限らず付与してから正規化する
    return URI.create(vdlApiConfig.data().request().endpoint() + "/").normalize();
  }

  public static URI getVdlPathUri(
      VdlApiConfig vdlApiConfig, String formattedTargetDateTime, String fileName) {
    // パスパラメーターにVDLのパス（スラッシュで開始）を指定するため意図的に"…/data//provider-tire4/…"となるように設定する
    // 正規化（java.net.URI.normalize()）はしないこと
    // VDLパス
    String vdlPath =
        Paths.get(
                MessageFormat.format(
                    "{0}/{1}/{2}",
                    vdlApiConfig.data().request().vdlPathPrefix(),
                    formattedTargetDateTime,
                    fileName))
            .normalize()
            .toString();
    return URI.create(getVdlPathBaseUri(vdlApiConfig) + vdlPath);
  }
}
