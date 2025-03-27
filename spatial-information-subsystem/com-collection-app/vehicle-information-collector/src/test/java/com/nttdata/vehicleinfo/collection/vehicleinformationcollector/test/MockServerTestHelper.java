package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test;

import com.nttdata.vdl.api.client.VdlApiConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.AuthApiConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.DigitalZensoApiConfig;
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
    //   CustomProperties.VEHICLE_AUTH_API_LOGIN_REQUEST_ENDPOINT,
    //   CustomProperties.VEHICLE_TIER4_DIGITAL_ZENSO_API_VEHICLES_REQUEST_ENDPOINT,
    //   CustomProperties.VEHICLE_VDL_API_TOKEN_REQUEST_ENDPOINT,
    //   CustomProperties.VEHICLE_VDL_API_DATA_REQUEST_ENDPOINT
    // })
    public static final String VEHICLE_TIER4_DIGITAL_ZENSO_API_VEHICLES_REQUEST_ENDPOINT =
        "vehicle.tier4.digital-zenso-api.vehicles.request.endpoint=http://localhost:${mockServerPort}/vehicles";

    public static final String VEHICLE_AUTH_API_LOGIN_REQUEST_ENDPOINT =
        "vehicle.auth-api.login.request.endpoint=http://localhost:${mockServerPort}/auth/login";

    public static final String VEHICLE_VDL_API_TOKEN_REQUEST_ENDPOINT =
        "vehicle.vdl.api.token.request.endpoint=http://localhost:${mockServerPort}/realms/vdl/protocol/openid-connect/token";

    public static final String VEHICLE_VDL_API_DATA_REQUEST_ENDPOINT =
        "vehicle.vdl.api.data.request.endpoint=http://localhost:${mockServerPort}/api/v1/data";
  }

  public static HttpRequest getLoginRequest(AuthApiConfig authApiConfig) {
    try {
      AuthApiConfig.Login.Request.Parameters p = authApiConfig.login().request().parameters();
      String template =
          """
          {"operatorAccountId":"%s","accountPassword":"%s"}
          """;
      String body = template.formatted(p.operatorAccountId(), p.accountPassword());
      String endpoint = URI.create(authApiConfig.login().request().endpoint()).toURL().getPath();
      return HttpRequest.request()
          .withMethod("POST")
          .withPath(endpoint)
          .withHeader("apiKey", authApiConfig.login().key())
          .withHeader("Content-Type", "application/json")
          .withBody(body);
    } catch (MalformedURLException e) {
      throw new RuntimeException(e);
    }
  }

  public static HttpResponse getLoginResponseOk() {
    String body =
        """
        {
          "accessToken": "accessToken",
          "refreshToken": "refreshToken"
        }
        """;
    // ログイン成功時は201
    return HttpResponse.response().withStatusCode(201).withBody(body);
  }

  public static HttpResponse getLoginResponseNg() {
    // NGは201以外
    return HttpResponse.response().withStatusCode(500);
  }

  public static HttpRequest getVehiclesRequest(DigitalZensoApiConfig digitalZensoApiConfig) {
    try {
      String endpoint =
          URI.create(digitalZensoApiConfig.vehicles().request().endpoint()).toURL().getPath();
      // .header("apiKey", digitalZensoApiConfig.key())
      // .header("Authorization", "Bearer " + accessToken)
      return HttpRequest.request()
          .withMethod("GET")
          .withPath(endpoint)
          // withHeader()で指定したヘッダーが含まれている場合のみマッチする
          .withHeader("apiKey", digitalZensoApiConfig.key())
          .withHeader("Authorization", "Bearer accessToken"); // getLoginResponseOk()のbodyと合わせる
    } catch (MalformedURLException e) {
      throw new RuntimeException(e);
    }
  }

  public static HttpResponse getVehiclesResponse20241119000000() {
    String body = VehiclesResponseParserTestHelper.get20241119000000().getResponseBody();
    return HttpResponse.response().withStatusCode(200).withBody(body);
  }

  public static HttpResponse getVehiclesResponseRetryableStatusCode() {
    // リトライ可能なステータスコードを設定
    // vehiclesは200以外はリトライ可能
    return HttpResponse.response().withStatusCode(500);
  }

  public static HttpResponse getVehiclesResponseWaitRequestTimeout(
      DigitalZensoApiConfig digitalZensoApiConfig) {
    // HTTPリクエストがタイムアウトするまで待つ
    Delay delay =
        Delay.delay(
            TimeUnit.NANOSECONDS, digitalZensoApiConfig.vehicles().request().timeoutNanos() * 2);
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
              VehiclesResponseParserTestHelper.getResourceDataDirAsPath(
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
