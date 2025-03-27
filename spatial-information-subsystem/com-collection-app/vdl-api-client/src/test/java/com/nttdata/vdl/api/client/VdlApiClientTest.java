package com.nttdata.vdl.api.client;

import static com.nttdata.vdl.api.client.test.DynamicPropertySourceTestHelper.Keys.*;
import static com.nttdata.vdl.api.client.test.MockServerTestHelper.*;
import static com.nttdata.vdl.api.client.test.ResourceTestHelper.*;
import static org.junit.jupiter.api.Assertions.*;

import com.nttdata.vdl.api.client.test.MockServerTestHelper;
import com.nttdata.vdl.api.client.test.TestVdApiClient;
import com.nttdata.vdl.api.client.test.TestVdlApiConfig;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.util.concurrent.CompletionException;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import org.junit.jupiter.api.Test;
import org.mockserver.client.MockServerClient;
import org.mockserver.springtest.MockServerTest;
import org.mockserver.verify.VerificationTimes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@MockServerTest({
  CustomProperties.VDL_API_TOKEN_REQUEST_ENDPOINT,
  CustomProperties.VDL_API_DATA_REQUEST_ENDPOINT
})
@SpringBootTest(classes = {TestVdApiClient.class, TestVdlApiConfig.class})
@EnableConfigurationProperties(TestVdlApiConfig.class)
class VdlApiClientTest {

  @Autowired private TestVdlApiConfig testVdlApiConfig;
  @Autowired private TestVdApiClient testVdApiClient;

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;

  private VdlApiConfig vdlApiConfig;
  private VdlApiClient vdlApiClient;

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
  }

  @PostConstruct
  void init() {
    vdlApiConfig = testVdlApiConfig.getApi();
    vdlApiClient = testVdApiClient.getVdlApiClient();
  }

  @Test
  void get() {
    // -------------------------
    // 1. OKの場合はレスポンスボディが取得できること
    // -------------------------
    // 準備
    String getOkVdlPath = MockServerTestHelper.getVdlPath(vdlApiConfig, "get_ok.json");

    // 認証のモックを設定 OK
    mockServerClient.when(getVdlAuthRequest(vdlApiConfig)).respond(getVdlAuthResponseOk());
    // Dataのモックを設定 OK
    mockServerClient
        .when(getVdlDataRequestGet(vdlApiConfig, getOkVdlPath))
        .respond(getVdlDataResponseGetOk());
    // 実行
    String response = vdlApiClient.get(getOkVdlPath);
    // 検証
    assertEquals(getVdlDataResponseGetOk().getBodyAsString(), response);

    // -------------------------
    // 2. NGの場合はRuntimeExceptionが発生すること
    // -------------------------
    String getNgVdlPath = MockServerTestHelper.getVdlPath(vdlApiConfig, "get_ok.json");
    mockServerClient.reset();
    // 認証のモックを設定 OK
    mockServerClient.when(getVdlAuthRequest(vdlApiConfig)).respond(getVdlAuthResponseOk());
    // Dataのモックを設定 NG
    mockServerClient
        .when(getVdlDataRequestGet(vdlApiConfig, getNgVdlPath))
        .respond(getVdlDataResponseGetNg());
    // 実行
    // 検証
    assertThrows(
        RuntimeException.class,
        () -> {
          vdlApiClient.get(getNgVdlPath);
        });
  }

  @Test
  void post() {
    // -------------------------
    // 1. POSTリクエストが正しい、かつ、201 Createdの場合は正常に終了すること
    // -------------------------
    // 準備
    String postOk201FileName = FILE_NAME_TEST;
    // 認証のモックを設定 OK
    mockServerClient.when(getVdlAuthRequest(vdlApiConfig)).respond(getVdlAuthResponseOk());
    // Dataのモックを設定 201 Created
    mockServerClient
        .when(getVdlDataRequestPostTestData(vdlApiConfig, postOk201FileName))
        .respond(getVdlDataResponsePostCreated201());
    // 実行
    vdlApiClient.post(postOk201FileName, getPostTestFilePath());
    // リクエストが1回送信されていること
    mockServerClient.verify(
        getVdlDataRequestPostTestData(vdlApiConfig, postOk201FileName),
        VerificationTimes.exactly(1));

    // -------------------------
    // 2. POSTリクエストが正しい、かつ、409 Conflictの場合は正常に終了する
    // -------------------------
    // 準備
    mockServerClient.reset();
    String postOk409FileName = FILE_NAME_TEST;
    // 認証のモックを設定 OK
    mockServerClient.when(getVdlAuthRequest(vdlApiConfig)).respond(getVdlAuthResponseOk());
    // Dataのモックを設定 409 Conflict
    mockServerClient
        .when(getVdlDataRequestPostTestData(vdlApiConfig, postOk409FileName))
        .respond(getVdlDataResponsePostConflict409());
    // 実行
    vdlApiClient.post(postOk409FileName, getPostTestFilePath());
    // リクエストが1回送信されていること
    mockServerClient.verify(
        getVdlDataRequestPostTestData(vdlApiConfig, postOk409FileName),
        VerificationTimes.exactly(1));

    // -------------------------
    // 3. NGの場合はRuntimeExceptionが発生すること
    // -------------------------
    // 準備
    mockServerClient.reset();
    String postNgFileName = "post_ng.json";
    // 認証のモックを設定 OK
    mockServerClient.when(getVdlAuthRequest(vdlApiConfig)).respond(getVdlAuthResponseOk());
    // Dataのモックを設定 NG
    mockServerClient
        .when(getVdlDataRequestPostNg(vdlApiConfig, postNgFileName))
        .respond(getVdlDataResponsePostNg());
    // 実行
    // 検証
    // NGの場合はRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          vdlApiClient.post(postNgFileName, getPostTestFilePath());
        });
    // リクエストが1回送信されていること
    mockServerClient.verify(
        getVdlDataRequestPostNg(vdlApiConfig, postNgFileName), VerificationTimes.exactly(1));

    // -------------------------
    // 4. 送信ファイルの読み込みでIOExceptionが発生した場合は、RuntimeExceptionにすること
    // -------------------------
    // 準備
    mockServerClient.reset();
    // 送信ファイルを読み取り不可にする
    boolean setReadableSuccess = getPostIOExceptionFilePath().toFile().setReadable(false);
    assertTrue(setReadableSuccess);
    // 実行
    // 検証
    // NGの場合はRuntimeExceptionが発生すること
    RuntimeException e =
        assertThrows(
            RuntimeException.class,
            () -> {
              vdlApiClient.post(FILE_NAME_POST_IOEXCEPTION, getPostIOExceptionFilePath());
            });
    assertInstanceOf(IOException.class, e.getCause());
  }

  @Test
  void delete() {
    // -------------------------
    // 1. DELETEリクエストが正しい、かつ、204 Deletedの場合は正常に終了すること
    // -------------------------
    // 準備
    String deleteOkFileName = "delete_ok.json";
    // 認証のモックを設定 OK
    mockServerClient.when(getVdlAuthRequest(vdlApiConfig)).respond(getVdlAuthResponseOk());
    // Dataのモックを設定 OK
    mockServerClient
        .when(getVdlDataRequestDelete(vdlApiConfig, deleteOkFileName))
        .respond(getVdlDataResponseDeleteDeleted204());
    // 実行
    vdlApiClient.delete(deleteOkFileName);
    // リクエストが1回送信されていること
    mockServerClient.verify(
        getVdlDataRequestDelete(vdlApiConfig, deleteOkFileName), VerificationTimes.exactly(1));

    // -------------------------
    // 2. NGの場合はRuntimeExceptionが発生すること
    // -------------------------
    // 準備
    String deleteNgFileName = "delete_ng.json";
    mockServerClient.reset();
    // 認証のモックを設定 OK
    mockServerClient.when(getVdlAuthRequest(vdlApiConfig)).respond(getVdlAuthResponseOk());
    // Dataのモックを設定 NG
    mockServerClient
        .when(getVdlDataRequestDelete(vdlApiConfig, deleteNgFileName))
        .respond(getVdlDataResponseDeleteNg());
    // 実行
    // 検証
    assertThrows(
        RuntimeException.class,
        () -> {
          vdlApiClient.delete(deleteNgFileName);
        });
  }

  @Test
  void getToken() {
    // -------------------------
    // 1. OKの場合はレスポンスのJSONで初期化されたVdlTokenResponseParserが取得できること
    // -------------------------
    // 準備
    mockServerClient.when(getVdlAuthRequest(vdlApiConfig)).respond(getVdlAuthResponseOk());
    // 実行
    VdlTokenResponseParser responseParser = vdlApiClient.getToken();
    // 検証
    // レスポンスボディの中身が一致すること
    assertEquals(getVdlAuthResponseOk().getBodyAsString(), responseParser.getResponseBody());
    // リクエストが1回送信されていること
    mockServerClient.verify(getVdlAuthRequest(vdlApiConfig), VerificationTimes.exactly(1));

    // -------------------------
    // 2. NGの場合はRuntimeExceptionが発生すること
    // -------------------------
    // 準備
    mockServerClient.reset();
    mockServerClient.when(getVdlAuthRequest(vdlApiConfig)).respond(getVdlAuthResponseNg());
    // 実行
    // 検証
    assertThrows(
        RuntimeException.class,
        () -> {
          vdlApiClient.getToken();
        });
    // リクエストが1回送信されていること
    mockServerClient.verify(getVdlAuthRequest(vdlApiConfig), VerificationTimes.exactly(1));
  }

  @Test
  void createTokenBodyPublisher() {
    // 準備
    StringBuilder builder = new StringBuilder();
    VdlApiConfig.Token.Request.Parameters p = vdlApiConfig.token().request().parameters();
    builder.append("client_id=").append(p.clientId()).append("&");
    builder.append("client_secret=").append(p.clientSecret()).append("&");
    builder.append("username=").append(p.username()).append("&");
    builder.append("password=").append(p.password()).append("&");
    builder.append("grant_type=").append(p.grantType()).append("&");
    builder.append("scope=").append(p.scope());
    HttpRequest.BodyPublisher expected = HttpRequest.BodyPublishers.ofString(builder.toString());
    // 実行
    HttpRequest.BodyPublisher actual = vdlApiClient.createTokenBodyPublisher();
    // 検証
    // サイズが一致すること
    assertEquals(expected.contentLength(), actual.contentLength());
  }

  @Test
  void getTokenHttpClient() {
    // verify-sslがfalse
    assertFalse(vdlApiConfig.data().request().verifySsl());
    HttpClient httpClient = vdlApiClient.getTokenHttpClient();
    // ProtocolにTLSが設定されていること
    assertEquals("TLS", httpClient.sslContext().getProtocol());
  }

  @Test
  void getDataHttpClient() {
    // verify-sslがfalse
    assertFalse(vdlApiConfig.data().request().verifySsl());
    HttpClient httpClient = vdlApiClient.getDataHttpClient();
    // ProtocolにTLSが設定されていること
    assertEquals("TLS", httpClient.sslContext().getProtocol());
  }

  @Test
  void getVerifySkipSSLContext() {
    SSLContext sslContext = vdlApiClient.getVerifySkipSSLContext();
    // ProtocolにTLSが設定されていること
    assertEquals("TLS", sslContext.getProtocol());
  }

  @Test
  void initSSLContext() {
    // 例外が発生せずに初期化されていること
    // 準備
    TrustManager trustManager = new NoVerifyTrustManager();
    SSLContext sslContext = vdlApiClient.getSSLContextInstance("TLS");
    // 初期化されていない場合はSocketFactory()で例外が発生する
    assertThrows(IllegalStateException.class, sslContext::getSocketFactory);
    // 実行
    vdlApiClient.initSSLContext(trustManager, sslContext);
    // 検証
    assertDoesNotThrow(sslContext::getSocketFactory);

    // 初期化失敗時のテストはKeyManagementExceptionを発生させることが難しいため保留
  }

  @Test
  void getSSLContextInstance() {
    // 指定したプロトコルのインスタンスが取得できていること
    String expected = "TLS";
    SSLContext sslContext = vdlApiClient.getSSLContextInstance(expected);
    assertEquals(expected, sslContext.getProtocol());

    // 不正なプロトコルの場合はRuntimeExceptionが発生すること
    assertThrows(RuntimeException.class, () -> vdlApiClient.getSSLContextInstance("INVALID"));
  }

  @Test
  void getBaseUri() {
    URI expected = URI.create("http://localhost/test/");
    assertEquals(expected, vdlApiClient.getBaseUri("http://localhost/test"));
    assertEquals(expected, vdlApiClient.getBaseUri("http://localhost/test/"));
    assertEquals(expected, vdlApiClient.getBaseUri("http://localhost/test//"));
  }

  @Test
  void getVdlPath() {
    String relativeFilePath = "test/test.json";
    String expected = vdlApiConfig.data().request().vdlPathPrefix() + "/" + relativeFilePath;
    String actual = vdlApiClient.getVdlPath(relativeFilePath);
    assertEquals(expected, actual);
  }

  @Test
  void getUri() {
    String relativeFilePath = "dir/file.json";
    URI expected =
        URI.create(
            vdlApiConfig.data().request().endpoint()
                + "/"
                + vdlApiConfig.data().request().vdlPathPrefix()
                + "/"
                + relativeFilePath);
    URI actual = vdlApiClient.getUri(relativeFilePath);
    assertEquals(expected, actual);
  }
}

@SpringBootTest(classes = {TestVdApiClient.class, TestVdlApiConfig.class})
@EnableConfigurationProperties(TestVdlApiConfig.class)
@ActiveProfiles({"verify-ssl-true"})
class VerifySslTrueTest {

  @Autowired private TestVdlApiConfig testVdlApiConfig;
  @Autowired private TestVdApiClient testVdApiClient;

  private VdlApiConfig vdlApiConfig;
  private VdlApiClient vdlApiClient;

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
  }

  @PostConstruct
  void init() {
    vdlApiConfig = testVdlApiConfig.getApi();
    vdlApiClient = testVdApiClient.getVdlApiClient();
  }

  @Test
  void getTokenHttpClient() {
    // verify-sslがtrue
    assertTrue(vdlApiConfig.token().request().verifySsl());
    HttpClient httpClient = vdlApiClient.getTokenHttpClient();
    // ProtocolにDefaultが設定されていること
    assertEquals("Default", httpClient.sslContext().getProtocol());
  }

  @Test
  void getDataHttpClient() {
    // verify-sslがtrue
    assertTrue(vdlApiConfig.data().request().verifySsl());
    HttpClient httpClient = vdlApiClient.getDataHttpClient();
    // ProtocolにDefaultが設定されていること
    assertEquals("Default", httpClient.sslContext().getProtocol());
  }
}

@MockServerTest({
  CustomProperties.VDL_API_TOKEN_REQUEST_ENDPOINT,
  CustomProperties.VDL_API_DATA_REQUEST_ENDPOINT
})
@SpringBootTest(classes = {TestVdApiClient.class, TestVdlApiConfig.class})
@EnableConfigurationProperties(TestVdlApiConfig.class)
@ActiveProfiles({"request-timeout"})
class RequestTimeoutTest {

  @Autowired private TestVdlApiConfig testVdlApiConfig;
  @Autowired private TestVdApiClient testVdApiClient;

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;
  private VdlApiConfig vdlApiConfig;
  private VdlApiClient vdlApiClient;

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
  }

  @PostConstruct
  void init() {
    vdlApiConfig = testVdlApiConfig.getApi();
    vdlApiClient = testVdApiClient.getVdlApiClient();
  }

  @Test
  void getToken_timeout() {
    // HTTPリクエストがタイムアウトした場合はCompletionExceptionが発生すること
    // 準備
    mockServerClient
        .when(getVdlAuthRequest(vdlApiConfig))
        .respond(getVdlAuthResponseResponseWaitRequestTimeout(vdlApiConfig));

    // 実行と検証
    assertThrows(
        CompletionException.class,
        () -> {
          vdlApiClient.getToken();
        });
    // リクエストが1回送信されていること
    mockServerClient.verify(getVdlAuthRequest(vdlApiConfig), VerificationTimes.exactly(1));
  }

  @Test
  void get_timeout() {
    // HTTPリクエストがタイムアウトした場合はCompletionExceptionが発生すること
    // 準備
    String vdlPath = "get_timeout.json";

    // 認証のモックを設定 OK
    mockServerClient.when(getVdlAuthRequest(vdlApiConfig)).respond(getVdlAuthResponseOk());
    // Dataのモックを設定 timeout
    mockServerClient
        .when(getVdlDataRequestGet(vdlApiConfig, vdlPath))
        .respond(getVdlDataResponseResponseWaitRequestTimeout(vdlApiConfig));

    // 実行と検証
    assertThrows(
        CompletionException.class,
        () -> {
          vdlApiClient.get(vdlPath);
        });
    // リクエストが1回送信されていること
    mockServerClient.verify(
        getVdlDataRequestGet(vdlApiConfig, vdlPath), VerificationTimes.exactly(1));
  }

  @Test
  void post_timeout() {
    // HTTPリクエストがタイムアウトした場合はCompletionExceptionが発生すること
    // 準備
    String vdlPath = FILE_NAME_TEST;

    // 認証のモックを設定 OK
    mockServerClient.when(getVdlAuthRequest(vdlApiConfig)).respond(getVdlAuthResponseOk());
    // Dataのモックを設定 timeout
    mockServerClient
        .when(getVdlDataRequestPostTestData(vdlApiConfig, vdlPath))
        .respond(getVdlDataResponseResponseWaitRequestTimeout(vdlApiConfig));

    // 実行と検証
    assertThrows(
        CompletionException.class,
        () -> {
          vdlApiClient.post(vdlPath, getPostTestFilePath());
        });
    // リクエストが1回送信されていること
    mockServerClient.verify(
        getVdlDataRequestPostTestData(vdlApiConfig, vdlPath), VerificationTimes.exactly(1));
  }

  @Test
  void delete_timeout() {
    // HTTPリクエストがタイムアウトした場合はCompletionExceptionが発生すること
    // 準備
    String vdlPath = "delete_timeout.json";

    // 認証のモックを設定 OK
    mockServerClient.when(getVdlAuthRequest(vdlApiConfig)).respond(getVdlAuthResponseOk());
    // Dataのモックを設定 timeout
    mockServerClient
        .when(getVdlDataRequestDelete(vdlApiConfig, vdlPath))
        .respond(getVdlAuthResponseResponseWaitRequestTimeout(vdlApiConfig));

    // 実行と検証
    assertThrows(
        CompletionException.class,
        () -> {
          vdlApiClient.delete(vdlPath);
        });
    // リクエストが1回送信されていること
    mockServerClient.verify(
        getVdlDataRequestDelete(vdlApiConfig, vdlPath), VerificationTimes.exactly(1));
  }
}
