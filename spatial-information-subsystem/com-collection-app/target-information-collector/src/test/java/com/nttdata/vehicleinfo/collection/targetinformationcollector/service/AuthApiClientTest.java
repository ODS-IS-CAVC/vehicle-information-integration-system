package com.nttdata.vehicleinfo.collection.targetinformationcollector.service;

import static com.nttdata.vehicleinfo.collection.targetinformationcollector.test.DynamicPropertySourceTestHelper.*;
import static org.junit.jupiter.api.Assertions.*;

import com.nttdata.vehicleinfo.collection.targetinformationcollector.config.AuthApiConfig;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.parser.LoginResponseParser;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.test.MockServerTestHelper;
import java.lang.invoke.MethodHandles;
import java.net.http.HttpRequest;
import org.junit.jupiter.api.Test;
import org.mockserver.client.MockServerClient;
import org.mockserver.springtest.MockServerTest;
import org.mockserver.verify.VerificationTimes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@MockServerTest({MockServerTestHelper.CustomProperties.TARGET_AUTH_API_LOGIN_REQUEST_ENDPOINT})
@SpringBootTest
class AuthApiClientTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;
  @Autowired private AuthApiClient authApiClient;
  @Autowired private AuthApiConfig authApiConfig;

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(Keys.TARGET_TIER_4_TARGET_INFO_API_KEY, () -> "TEST");
    registry.add(Keys.TARGET_VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(Keys.TARGET_VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
    registry.add(Keys.TARGET_AUTH_API_LOGIN_KEY, () -> "TEST");
    registry.add(Keys.TARGET_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID, () -> "TEST");
    registry.add(Keys.TARGET_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD, () -> "TEST");
  }

  @Test
  void login() {
    // -------------------------
    // 1. OKの場合はレスポンスのJSONで初期化されたLoginResponseParserが取得できること
    // -------------------------
    // 準備
    mockServerClient
        .when(MockServerTestHelper.getLoginRequest(authApiConfig))
        .respond(MockServerTestHelper.getLoginResponseOk());
    // 実行
    LoginResponseParser loginResponseParser = authApiClient.login();
    // 検証
    // レスポンスボディの中身が一致すること
    assertEquals(
        MockServerTestHelper.getLoginResponseOk().getBodyAsString(),
        loginResponseParser.getResponseBody());
    // リクエストが1回送信されていること
    mockServerClient.verify(
        MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(1));

    // -------------------------
    // 2. NGの場合はRuntimeExceptionが発生すること
    // -------------------------
    // 準備
    mockServerClient.reset();
    mockServerClient
        .when(MockServerTestHelper.getLoginRequest(authApiConfig))
        .respond(MockServerTestHelper.getLoginResponseNg());
    // 実行
    // 検証
    assertThrows(
        RuntimeException.class,
        () -> {
          authApiClient.login();
        });
    // リクエストが1回送信されていること
    mockServerClient.verify(
        MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(1));
  }

  @Test
  void createTokenBodyPublisher() {
    // 準備
    AuthApiConfig.Login.Request.Parameters p = authApiConfig.login().request().parameters();
    String template =
        """
        {"operatorAccountId":"%s","accountPassword":"%s"}
        """;
    String body = template.formatted(p.operatorAccountId(), p.accountPassword());
    HttpRequest.BodyPublisher expected = HttpRequest.BodyPublishers.ofString(body);
    // 実行
    HttpRequest.BodyPublisher actual = authApiClient.createTokenBodyPublisher();
    // 検証
    // サイズが一致すること
    assertEquals(expected.contentLength(), actual.contentLength());
  }
}
