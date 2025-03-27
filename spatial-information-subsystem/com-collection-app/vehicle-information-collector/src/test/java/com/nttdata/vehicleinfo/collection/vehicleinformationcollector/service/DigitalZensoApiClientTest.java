package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.service;

import static com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test.DynamicPropertySourceTestHelper.Keys.*;
import static org.junit.jupiter.api.Assertions.*;

import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.AuthApiConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.DigitalZensoApiConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.exception.RetryableRuntimeException;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test.MockServerTestHelper;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockserver.client.MockServerClient;
import org.mockserver.springtest.MockServerTest;
import org.mockserver.verify.VerificationTimes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@MockServerTest({
  MockServerTestHelper.CustomProperties.VEHICLE_AUTH_API_LOGIN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VEHICLE_TIER4_DIGITAL_ZENSO_API_VEHICLES_REQUEST_ENDPOINT
})
@SpringBootTest
class DigitalZensoApiClientTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;

  @Autowired private DigitalZensoApiClient digitalZensoApiClient;
  @Autowired private DigitalZensoApiConfig digitalZensoApiConfig;
  @Autowired private AuthApiConfig authApiConfig;

  @DynamicPropertySource
  static void defaultDynamicProperties(DynamicPropertyRegistry registry) {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(VEHICLE_TIER4_DIGITAL_ZENSO_API_KEY, () -> "TEST");
    registry.add(VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_KEY, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD, () -> "TEST");
  }

  @BeforeEach
  void before() throws IOException {
    // レスポンスの保存ディレクトリを空にする
    String dir = digitalZensoApiConfig.vehicles().response().save().directory();
    Path path = Paths.get(dir);
    try (Stream<Path> tree = Files.walk(path)) {
      tree.sorted(Comparator.reverseOrder())
          .forEach(
              p -> {
                try {
                  Files.delete(p);
                } catch (IOException e) {
                  throw new RuntimeException(e);
                }
              });
    }
    Files.createDirectories(path);
    try (Stream<Path> stream = Files.list(path)) {
      assertEquals(0, stream.count());
    }
  }

  @Test
  void init() throws IOException {
    // 準備
    String dir = digitalZensoApiConfig.vehicles().response().save().directory();
    Path path = Paths.get(dir);
    // 実行
    digitalZensoApiClient.init();
    // 検証
    // ディレクトリが存在しない場合は作成されること
    assertTrue(Files.exists(path));
    // 既に存在している場合はエラーにならないこと
    digitalZensoApiClient.init();
  }

  @Test
  void formatTargetDateTime() {
    // 2024年01月07日01時02分03秒
    ZonedDateTime t =
        ZonedDateTime.of(
            2024, 1, 7, 1, 2, 3, 0, digitalZensoApiConfig.vehicles().timeZoneToZoneId());

    // 20240107010203になること
    assertEquals("20240107010203", digitalZensoApiClient.formatTargetDateTime(t));

    // 異なるタイムゾーンに変換しても結果が同じになること
    ZonedDateTime jst = t.withZoneSameInstant(ZoneId.of("Asia/Tokyo"));
    logger.info("jst={}", jst);
    ZonedDateTime utc = t.withZoneSameInstant(ZoneId.of("UTC"));
    logger.info("utc={}", utc);
    assertEquals("20240107010203", digitalZensoApiClient.formatTargetDateTime(jst));
    assertEquals("20240107010203", digitalZensoApiClient.formatTargetDateTime(utc));
  }

  @Test
  void getVehicles() {
    // handleExpired()を実行後にexecuteRetryableRequestAndSave()が呼ばれていること
    //   1. 期限切れの対象日時を指定することでhandleExpired()が先に実行されていることを確認する
    //   2. 有効な日時を指定することでexecuteRetryableRequestAndSave()が実行されていることを確認する

    // -------------------------
    // 1. 期限切れの対象日時を指定することでhandleExpired()が先に実行されていることを確認する
    // -------------------------
    // 準備
    String expiredTarget = "19700101000000";
    // AuthApi 呼ばれない
    // debug-auth-skip=false
    assertFalse(digitalZensoApiConfig.debugAuthSkip());
    mockServerClient
        .when(MockServerTestHelper.getLoginRequest(authApiConfig))
        .respond(MockServerTestHelper.getLoginResponseOk());
    // DigitalZensoApi 呼ばれない
    mockServerClient
        .when(MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig))
        .respond(MockServerTestHelper.getVehiclesResponse20241119000000());

    // 期限切れの場合はRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          digitalZensoApiClient.getVehicles(expiredTarget);
        });
    // リクエストが送信されていないこと
    mockServerClient.verify(
        MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(0));
    mockServerClient.verify(
        MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
        VerificationTimes.exactly(0));

    // -------------------------
    // 2. 有効な日時を指定することでexecuteRetryableRequestAndSave()が実行されていることを確認する
    // -------------------------
    // 準備
    mockServerClient.reset();
    ZonedDateTime now = ZonedDateTime.now(digitalZensoApiConfig.vehicles().timeZoneToZoneId());
    String activeTarget = digitalZensoApiClient.formatTargetDateTime(now);

    // AuthApi OK
    // debug-auth-skip=false
    assertFalse(digitalZensoApiConfig.debugAuthSkip());
    mockServerClient
        .when(MockServerTestHelper.getLoginRequest(authApiConfig))
        .respond(MockServerTestHelper.getLoginResponseOk());
    // DigitalZensoApi OK
    mockServerClient
        .when(MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig))
        .respond(MockServerTestHelper.getVehiclesResponse20241119000000());

    // 実行
    digitalZensoApiClient.getVehicles(activeTarget);

    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(
        MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(1));
    mockServerClient.verify(
        MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
        VerificationTimes.exactly(1));
  }

  @Test
  void handleStatusCode() {
    // 200の場合はエラーがでないこと
    digitalZensoApiClient.handleStatusCode(200);

    // 400の場合はRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          digitalZensoApiClient.handleStatusCode(400);
        });
    // 401の場合はRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          digitalZensoApiClient.handleStatusCode(401);
        });

    // 500の場合はRetryableRuntimeExceptionが発生すること
    assertThrows(
        RetryableRuntimeException.class,
        () -> {
          digitalZensoApiClient.handleStatusCode(500);
        });
    // 503の場合はRetryableRuntimeExceptionが発生すること
    assertThrows(
        RetryableRuntimeException.class,
        () -> {
          digitalZensoApiClient.handleStatusCode(503);
        });

    // 上記以外はRetryableRuntimeExceptionが発生すること
    assertThrows(
        RetryableRuntimeException.class,
        () -> {
          digitalZensoApiClient.handleStatusCode(404);
        });
  }

  @Test
  void handleErrorCode() {
    // 例外が発生しないこと
    try {
      digitalZensoApiClient.handleErrorCode(null);
    } catch (Exception e) {
      fail("例外が発生しないこと");
    }
  }

  @Test
  void handleVersion() {
    // 例外が発生しないこと
    try {
      digitalZensoApiClient.handleVersion(null, null);
    } catch (Exception e) {
      fail("例外が発生しないこと");
    }
  }

  @Test
  void handleExpired() {
    // 基準日時(20241126000000)
    ZonedDateTime base =
        ZonedDateTime.of(
            2024, 11, 26, 0, 0, 0, 0, digitalZensoApiConfig.vehicles().timeZoneToZoneId());
    String baseStr = digitalZensoApiClient.formatTargetDateTime(base);
    // timeoutナノ秒
    long timeoutNanos = digitalZensoApiConfig.vehicles().request().retry().timeoutNanos();

    // 期限が切れていない場合は例外は発生しないこと
    try {
      // 有効日時Max（基準日時からtimeoutナノ秒経過した日時）
      ZonedDateTime activeMax = base.plusNanos(timeoutNanos);
      logger.info("baseStr={}, activeMax={}", baseStr, activeMax);
      // 有効日時Maxの場合は例外は発生しない
      digitalZensoApiClient.handleExpired(baseStr, activeMax);
    } catch (Exception e) {
      fail("期限が切れていない場合は例外は発生しない");
    }

    // 期限切れの場合はRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          // 期限切れ日時Min（基準日時からtimeoutナノ秒+1ナノ秒経過した日時）
          ZonedDateTime expiredMin = base.plusNanos(timeoutNanos + 1);
          // 期限切れ日時Minは例外が発生する
          logger.info("baseStr={}, expiredMin={}", baseStr, expiredMin);
          digitalZensoApiClient.handleExpired(baseStr, expiredMin);
        });
  }

  @Test
  void request() {
    // リクエスト送信後にステータスコードのハンドリングが呼ばれていること
    // 1. ステータスコードがOKの場合はレスポンスが取得できること
    // 2. ステータスコードがNG、かつ、リトライが発生しない場合はRuntimeExceptionが発生すること
    //    ※OK以外はリトライするためテスト不可
    // 3. ステータスコードがNG、かつ、リトライが発生する場合はRetryableRuntimeExceptionが発生すること
    // ※エラーコードとバージョンは返ってこないためテスト不要

    // -------------------------
    // 1. ステータスコードがOKの場合はレスポンスが取得できること
    // -------------------------
    // 準備
    String oKtargetDate = "request_OK";
    mockServerClient
        .when(MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig))
        .respond(MockServerTestHelper.getVehiclesResponse20241119000000());

    // 実行
    digitalZensoApiClient.request(
        oKtargetDate, digitalZensoApiConfig.vehicles().request().endpointUri(), "accessToken");

    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(
        MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
        VerificationTimes.exactly(1));

    // -------------------------
    // 2. ステータスコードがNG、かつ、リトライが発生しない場合はRuntimeExceptionが発生すること
    //    ※OK以外はリトライするためテスト不可
    // -------------------------

    // -------------------------
    // 3. ステータスコードがNG、かつ、リトライが発生する場合はRetryableRuntimeExceptionが発生すること
    // -------------------------
    // 準備
    String retryTargetDate = "request_NG_Retry";
    mockServerClient.reset();
    mockServerClient
        .when(MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig))
        .respond(MockServerTestHelper.getVehiclesResponseRetryableStatusCode());

    // 実行
    assertThrows(
        RetryableRuntimeException.class,
        () -> {
          digitalZensoApiClient.request(
              retryTargetDate,
              digitalZensoApiConfig.vehicles().request().endpointUri(),
              "accessToken");
        });
    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(
        MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
        VerificationTimes.exactly(1));
  }

  @Test
  void save() throws IOException {
    // -------------------------
    // 1. 書き込み成功した場合、保存したファイルの中身が一致していること
    // -------------------------
    // 準備
    String formattedTargetDateTime = "save";
    String responseBody = "test save()";

    // 実行
    digitalZensoApiClient.save(formattedTargetDateTime, responseBody);

    // 検証
    try {
      // 保存されたファイルの中身が一致していること
      String actual =
          Files.readString(digitalZensoApiClient.getSaveFilePath(formattedTargetDateTime));
      assertEquals(responseBody, actual);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }

    // -------------------------
    // 2. IOExceptionが発生した場合はRuntimeExceptionにする
    // -------------------------
    // 準備
    String invalid = "invalid";
    Path invalidFilePath = digitalZensoApiClient.getSaveFilePath(invalid);
    // 書き込み不可ファイルを作成しておく
    Files.createDirectories(invalidFilePath.getParent());
    Files.writeString(invalidFilePath, invalid, StandardCharsets.UTF_8);
    invalidFilePath.toFile().setWritable(false);
    // 実行
    // 検証
    RuntimeException e =
        assertThrows(
            RuntimeException.class,
            () -> {
              digitalZensoApiClient.save(invalid, invalid);
            });
    assertTrue(e.getCause() instanceof IOException);
  }

  @Test
  void getSaveFilePath() {
    // vehicle.tier4.digital-zenso-api.vehicles.response.save.directoryとファイル名を結合したパスが取得できること
    Path expected =
        Path.of(
            digitalZensoApiConfig.vehicles().response().save().directory(),
            "test",
            "vehicles_test.json");
    Path actual = digitalZensoApiClient.getSaveFilePath("test");
    assertEquals(expected, actual);
  }

  @Test
  void executeRetryableRequestAndSave() {
    // -------------------------
    // 1. OK_レスポンスボディがファイルに保存されていること
    // -------------------------
    // 準備
    String targetDate = "executeRetryableRequestAndSave";
    // AuthApi OK
    // debug-auth-skip=false
    assertFalse(digitalZensoApiConfig.debugAuthSkip());
    mockServerClient
        .when(MockServerTestHelper.getLoginRequest(authApiConfig))
        .respond(MockServerTestHelper.getLoginResponseOk());
    // DigitalZensoApi OK
    mockServerClient
        .when(MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig))
        .respond(MockServerTestHelper.getVehiclesResponse20241119000000());

    // 実行
    digitalZensoApiClient.executeRetryableRequestAndSave(
        targetDate, digitalZensoApiConfig.vehicles().request().endpoint());

    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(
        MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(1));
    mockServerClient.verify(
        MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
        VerificationTimes.exactly(1));
    // 保存されたファイルの中身が一致していること
    try {
      String expected = MockServerTestHelper.getVehiclesResponse20241119000000().getBodyAsString();
      String actual = Files.readString(digitalZensoApiClient.getSaveFilePath(targetDate));
      assertEquals(expected, actual);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }

    // -------------------------
    // 2. OK_リトライありでレスポンスボディがファイルに保存されていること
    // -------------------------
    String retryTargetDate = "executeRetryableRequestAndSave_Retry";
    mockServerClient.reset(); // 最初に設定したものが優先されるためリセットする
    // AuthApi OK
    // debug-auth-skip=false
    assertFalse(digitalZensoApiConfig.debugAuthSkip());
    mockServerClient
        .when(MockServerTestHelper.getLoginRequest(authApiConfig))
        .respond(MockServerTestHelper.getLoginResponseOk());
    // DigitalZensoApi OK 1回目はリトライ 2回目はOK
    AtomicInteger requestCount = new AtomicInteger(0);
    mockServerClient
        .when(MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig))
        .respond(
            request -> {
              int count = requestCount.incrementAndGet();
              if (count == 1) {
                // 1回目はリトライが発生するステータスコードを返す
                logger.info("リトライ発生");
                return MockServerTestHelper.getVehiclesResponseRetryableStatusCode();
              } else {
                return MockServerTestHelper.getVehiclesResponse20241119000000();
              }
            });

    // 実行
    digitalZensoApiClient.executeRetryableRequestAndSave(
        retryTargetDate, digitalZensoApiConfig.vehicles().request().endpoint());
    // 検証
    // リクエストが2回送信されていること
    mockServerClient.verify(
        MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(2));
    mockServerClient.verify(
        MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
        VerificationTimes.exactly(2));
    // 保存されたファイルの中身が一致していること
    try {
      String actual = Files.readString(digitalZensoApiClient.getSaveFilePath(retryTargetDate));
      assertEquals(
          MockServerTestHelper.getVehiclesResponse20241119000000().getBodyAsString(), actual);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }

    // -------------------------
    // 3. NG_リトライがタイムアウトした場合はRuntimeExceptionが発生すること
    // -------------------------
    String timeoutTargetDate = "executeRetryableRequestAndSave_Timeout";
    mockServerClient.reset(); // 最初に設定したものが優先されるためリセットする
    // AuthApi OK
    // debug-auth-skip=false
    assertFalse(digitalZensoApiConfig.debugAuthSkip());
    mockServerClient
        .when(MockServerTestHelper.getLoginRequest(authApiConfig))
        .respond(MockServerTestHelper.getLoginResponseOk());
    // DigitalZensoApi NG タイムアウトするまでリトライ
    mockServerClient
        .when(MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig))
        .respond(MockServerTestHelper.getVehiclesResponseRetryableStatusCode());

    // 実行
    // リトライがタイムアウトした場合はRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          digitalZensoApiClient.executeRetryableRequestAndSave(
              timeoutTargetDate, digitalZensoApiConfig.vehicles().request().endpoint());
        });
    // タイムアウトするまで複数回リトライしていること（リクエストが2回以上送信されていること）
    mockServerClient.verify(
        MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.atLeast(2));
    mockServerClient.verify(
        MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
        VerificationTimes.atLeast(2));

    // -------------------------
    // 4. NG_HTTPリクエストがタイムアウトした場合はリトライせずにRuntimeExceptionが発生すること
    // -------------------------
    String requestTimeoutTargetDate = "executeRetryableRequestAndSave_RequestTimeout";
    mockServerClient.reset(); // 最初に設定したものが優先されるためリセットする
    // AuthApi OK
    // debug-auth-skip=false
    assertFalse(digitalZensoApiConfig.debugAuthSkip());
    mockServerClient
        .when(MockServerTestHelper.getLoginRequest(authApiConfig))
        .respond(MockServerTestHelper.getLoginResponseOk());
    // DigitalZensoApi NG
    mockServerClient
        .when(MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig))
        .respond(MockServerTestHelper.getVehiclesResponseWaitRequestTimeout(digitalZensoApiConfig));

    // 実行
    // HTTPリクエストがタイムアウトした場合はRuntimeExceptionが発生すること
    // request.timeout < retry.timeout　であること
    long requestTimeout = digitalZensoApiConfig.vehicles().request().timeoutNanos();
    long retryTimeout = digitalZensoApiConfig.vehicles().request().retry().timeoutNanos();
    assertTrue(requestTimeout < retryTimeout);
    assertThrows(
        RuntimeException.class,
        () -> {
          digitalZensoApiClient.executeRetryableRequestAndSave(
              requestTimeoutTargetDate, digitalZensoApiConfig.vehicles().request().endpoint());
        });
    // HTTPリクエストがタイムアウトしたこと（リクエストが1回送信されていること）
    mockServerClient.verify(
        MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(1));
    mockServerClient.verify(
        MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
        VerificationTimes.exactly(1));
  }
}

@MockServerTest({
  MockServerTestHelper.CustomProperties.VEHICLE_AUTH_API_LOGIN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VEHICLE_TIER4_DIGITAL_ZENSO_API_VEHICLES_REQUEST_ENDPOINT
})
@SpringBootTest
@ActiveProfiles({"ut", "debug-auth-skip-true"})
class DebugAuthSkipTrueTest {

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;

  @Autowired private DigitalZensoApiClient digitalZensoApiClient;
  @Autowired private DigitalZensoApiConfig digitalZensoApiConfig;
  @Autowired private AuthApiConfig authApiConfig;

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) throws URISyntaxException {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(VEHICLE_TIER4_DIGITAL_ZENSO_API_KEY, () -> "TEST");
    registry.add(VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_KEY, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD, () -> "TEST");
  }

  @Test
  void executeRetryableRequestAndSave() {
    // -------------------------
    // 1. debug-auth-skip=trueの場合はユーザー認証しない
    // -------------------------
    // 準備
    String targetDate = "executeRetryableRequestAndSave";
    // AuthApi OK
    // debug-auth-skip=true
    assertTrue(digitalZensoApiConfig.debugAuthSkip());
    mockServerClient
        .when(MockServerTestHelper.getLoginRequest(authApiConfig))
        .respond(MockServerTestHelper.getLoginResponseOk());
    // DigitalZensoApi OK
    mockServerClient
        .when(MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig))
        .respond(MockServerTestHelper.getVehiclesResponse20241119000000());

    // 実行
    digitalZensoApiClient.executeRetryableRequestAndSave(
        targetDate, digitalZensoApiConfig.vehicles().request().endpoint());

    // 検証
    // AuthApiにリクエストが送信されていないこと
    mockServerClient.verify(
        MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(0));
    // DigitalZensoApiにリクエストが1回送信されていること
    mockServerClient.verify(
        MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
        VerificationTimes.exactly(1));
    // 保存されたファイルの中身が一致していること
    try {
      String expected = MockServerTestHelper.getVehiclesResponse20241119000000().getBodyAsString();
      String actual = Files.readString(digitalZensoApiClient.getSaveFilePath(targetDate));
      assertEquals(expected, actual);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }
}
