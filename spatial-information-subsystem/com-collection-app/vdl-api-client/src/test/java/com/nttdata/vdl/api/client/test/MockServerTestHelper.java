package com.nttdata.vdl.api.client.test;

import com.nttdata.vdl.api.client.VdlApiConfig;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.nio.file.Files;
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
    //   CustomProperties.VDL_API_TOKEN_REQUEST_ENDPOINT,
    //   CustomProperties.VDL_API_DATA_REQUEST_ENDPOINT
    // })

    public static final String VDL_API_TOKEN_REQUEST_ENDPOINT =
        "vdl.api.token.request.endpoint=http://localhost:${mockServerPort}/realms/vdl/protocol/openid-connect/token";

    public static final String VDL_API_DATA_REQUEST_ENDPOINT =
        "vdl.api.data.request.endpoint=http://localhost:${mockServerPort}/api/v1/data";
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

  public static HttpResponse getVdlAuthResponseResponseWaitRequestTimeout(
      VdlApiConfig vdlApiConfig) {
    // HTTPリクエストがタイムアウトするまで待つ
    Delay delay =
        Delay.delay(TimeUnit.NANOSECONDS, vdlApiConfig.token().request().timeoutNanos() * 2);
    return HttpResponse.response().withDelay(delay).withStatusCode(200);
  }

  public static HttpRequest getVdlDataRequestGet(VdlApiConfig vdlApiConfig, String vdlPath) {
    URI vdlPathUri = getUri(vdlApiConfig, vdlPath);
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
      VdlApiConfig vdlApiConfig, String fileName) {
    // リソースのファイルでマッチさせる
    byte[] fileBytes;
    try {
      fileBytes = Files.readAllBytes(ResourceTestHelper.getResourceAsPath(fileName));
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
    return getVdlDataRequestPost(vdlApiConfig, fileName, fileBytes);
  }

  public static HttpRequest getVdlDataRequestPost(
      VdlApiConfig vdlApiConfig, String fileName, byte[] fileBytes) {
    URI vdlPathUri = getUri(vdlApiConfig, fileName);
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
    URI vdlPathUri = getBaseUri(vdlApiConfig);
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

  public static HttpRequest getVdlDataRequestPostNg(VdlApiConfig vdlApiConfig, String vdlPath) {
    // POSTに失敗するときのリクエストのためヘッダやボディは何でも良い
    URI vdlPathUri = getUri(vdlApiConfig, vdlPath);
    return HttpRequest.request().withMethod("POST").withPath(vdlPathUri.getPath());
  }

  public static HttpResponse getVdlDataResponsePostNg() {
    // Postは2xxと409はOK、それ以外はNG
    return HttpResponse.response().withStatusCode(500);
  }

  public static HttpRequest getVdlDataRequestDelete(VdlApiConfig vdlApiConfig, String vdlPath) {
    URI vdlPathUri = getUri(vdlApiConfig, vdlPath);
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

  public static HttpResponse getVdlDataResponseResponseWaitRequestTimeout(
      VdlApiConfig vdlApiConfig) {
    // HTTPリクエストがタイムアウトするまで待つ
    Delay delay =
        Delay.delay(TimeUnit.NANOSECONDS, vdlApiConfig.data().request().timeoutNanos() * 2);
    return HttpResponse.response().withDelay(delay).withStatusCode(200);
  }

  public static URI getBaseUri(VdlApiConfig vdlApiConfig) {
    // 末尾がスラッシュで終わるようにしたいのでスラッシュを付与してから正規化する
    return URI.create(vdlApiConfig.data().request().endpoint() + "/").normalize();
  }

  public static String getVdlPath(VdlApiConfig vdlApiConfig, String relativeFilePath) {
    // VDLパスの接頭語と連結して返す
    return vdlApiConfig.data().request().vdlPathPrefix() + "/" + relativeFilePath;
  }

  public static URI getUri(VdlApiConfig vdlApiConfig, String relativeFilePath) {
    // パスパラメーターにVDLのパス（スラッシュで開始）を指定するため意図的に"…/data//xxx/…"となるように設定する
    // 戻り値のURIを正規化（java.net.URI.normalize()）はしないこと
    // フォーマット:
    //   {ENDPOINT}/{VDL_PATH_PREFIX}/{relativeFilePath}
    // 設定例:
    //   ENDPOINT=http://localhost/api/v1/data
    //   VDL_PATH_PREFIX=/vdl-path-prefix/test
    //   relativeFilePath=dir/file.json
    // 結果:
    //   http://localhost/api/v1/data//vdl-path-prefix/test/dir/file.json
    String vdlPath = getVdlPath(vdlApiConfig, relativeFilePath);
    return URI.create(getBaseUri(vdlApiConfig) + vdlPath);
  }
}
