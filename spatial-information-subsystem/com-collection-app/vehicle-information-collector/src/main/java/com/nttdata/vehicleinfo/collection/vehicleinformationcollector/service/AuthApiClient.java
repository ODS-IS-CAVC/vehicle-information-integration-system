package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.service;

import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.AuthApiConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.parser.LoginResponseParser;
import java.lang.invoke.MethodHandles;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.MessageFormat;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * AuthApiClient
 *
 * <p>データ流通層の提供するユーザー認証システムApiを利用し、ユーザー認証システムを操作する。
 *
 * <p>ユーザー認証システムApiの/auth/loginを利用する。
 */
@Component
public class AuthApiClient {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final AuthApiConfig authApiConfig;

  /**
   * 指定された設定値で初期化して生成する。
   *
   * @param authApiConfig AuthApiConfig
   */
  public AuthApiClient(AuthApiConfig authApiConfig) {
    this.authApiConfig = authApiConfig;
  }

  /**
   * ログインする。
   *
   * <p>/auth/loginにPOSTリクエストを送信し、レスポンスの解析結果を返す。
   *
   * @return レスポンスの解析結果
   */
  public LoginResponseParser login() {
    logger.debug("{}", authApiConfig.login().request().parameters());
    URI uri = URI.create(authApiConfig.login().request().endpoint());

    try (HttpClient client = HttpClient.newHttpClient()) {
      // HTTPリクエスト生成
      /*
       --header 'apiKey: [VEHICLE_AUTH_API_LOGIN_KEY]'
       --header 'Content-Type: application/json'
       --data-raw '{
                      "operatorAccountId":"[VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID]",
                      "accountPassword":"[VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD]"
                   }'
      */
      Duration timeout = Duration.ofMillis(authApiConfig.login().request().timeout());
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(uri)
              .timeout(timeout)
              .header("apiKey", authApiConfig.login().key())
              .header("Content-Type", "application/json")
              .POST(createTokenBodyPublisher())
              .build();
      logger.debug("Login headers={}", request.headers().toString());
      // リクエスト送信
      logger.debug("Login {}", request.uri().toString());
      HttpResponse<String> response =
          client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).join();
      logger.debug("Login body={}", response.body());

      /*
      HTTP/2 201
      content-type: application/json; charset=UTF-8
      vary: Origin
      x-cloud-trace-context: 2a5fdb6910b09dc4aafc943cc16222ed;o=1
      date: Wed, 27 Nov 2024 14:19:50 GMT
      server: Google Frontend
      content-length: 2284
      via: 1.1 google
      alt-svc: h3=":443"; ma=2592000,h3-29=":443"; ma=2592000
      */
      // 2xx以外はエラー
      if (!HttpStatus.valueOf(response.statusCode()).is2xxSuccessful()) {
        throw new RuntimeException(
            MessageFormat.format("Loginに失敗: response={0} {1}", response, response.body()));
      }

      LoginResponseParser loginResponseParser = new LoginResponseParser(response.body());
      logger.debug("accessToken={}", loginResponseParser.getAccessToken());

      return loginResponseParser;
    }
  }

  HttpRequest.BodyPublisher createTokenBodyPublisher() {
    AuthApiConfig.Login.Request.Parameters p = authApiConfig.login().request().parameters();
    String template =
        """
        {"operatorAccountId":"%s","accountPassword":"%s"}
        """;
    String body = template.formatted(p.operatorAccountId(), p.accountPassword());
    logger.debug(body);
    return HttpRequest.BodyPublishers.ofString(body);
  }
}
