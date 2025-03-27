package com.nttdata.vehicleinfo.collection.targetinformationcollector.service;

import static com.nttdata.vehicleinfo.collection.targetinformationcollector.test.MockServerTestHelper.*;
import static org.junit.jupiter.api.Assertions.*;

import com.nttdata.vehicleinfo.collection.targetinformationcollector.config.AuthApiConfig;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.config.TargetInfoApiConfig;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.exception.RetryableRuntimeException;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.test.DynamicPropertySourceTestHelper;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.MessageFormat;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
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
  CustomProperties.TARGET_AUTH_API_LOGIN_REQUEST_ENDPOINT,
  CustomProperties.TARGET_TIER_4_TARGET_INFO_API_TARGET_INFO_REQUEST_ENDPOINT
})
@SpringBootTest
class TargetInfoApiClientTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;

  @Autowired private TargetInfoApiClient targetInfoApiClient;
  @Autowired private TargetInfoApiConfig targetInfoApiConfig;
  @Autowired private AuthApiConfig authApiConfig;

  @DynamicPropertySource
  static void defaultDynamicProperties(DynamicPropertyRegistry registry) {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(
        DynamicPropertySourceTestHelper.Keys.TARGET_TIER_4_TARGET_INFO_API_KEY, () -> "TEST");
    registry.add(
        DynamicPropertySourceTestHelper.Keys.TARGET_VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET,
        () -> "TEST");
    registry.add(
        DynamicPropertySourceTestHelper.Keys.TARGET_VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD,
        () -> "TEST");
    registry.add(DynamicPropertySourceTestHelper.Keys.TARGET_AUTH_API_LOGIN_KEY, () -> "TEST");
    registry.add(
        DynamicPropertySourceTestHelper.Keys
            .TARGET_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID,
        () -> "TEST");
    registry.add(
        DynamicPropertySourceTestHelper.Keys
            .TARGET_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD,
        () -> "TEST");
  }

  @BeforeEach
  void before() throws IOException {
    // レスポンスの保存ディレクトリを空にする
    String dir = targetInfoApiConfig.targetInfo().response().save().directory();
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
    String dir = targetInfoApiConfig.targetInfo().response().save().directory();
    Path path = Paths.get(dir);
    // 実行
    targetInfoApiClient.init();
    // 検証
    // ディレクトリが存在しない場合は作成されること
    assertTrue(Files.exists(path));
    // 既に存在している場合はエラーにならないこと
    targetInfoApiClient.init();
  }

  @Test
  void formatTargetDateTime() {
    // 2024年01月07日01時02分03秒
    ZonedDateTime t =
        ZonedDateTime.of(
            2024, 1, 7, 1, 2, 3, 0, targetInfoApiConfig.targetInfo().timeZoneToZoneId());

    // 20240107010203になること
    assertEquals("20240107010203", targetInfoApiClient.formatTargetDateTime(t));

    // 異なるタイムゾーンに変換しても結果が同じになること
    ZonedDateTime jst = t.withZoneSameInstant(ZoneId.of("Asia/Tokyo"));
    logger.info("jst={}", jst);
    ZonedDateTime utc = t.withZoneSameInstant(ZoneId.of("UTC"));
    logger.info("utc={}", utc);
    assertEquals("20240107010203", targetInfoApiClient.formatTargetDateTime(jst));
    assertEquals("20240107010203", targetInfoApiClient.formatTargetDateTime(utc));
  }

  @Test
  void createUri() {
    String endpoint = targetInfoApiConfig.targetInfo().request().endpoint();
    URI expected = URI.create(endpoint + "?serviceLocationID=16777215&roadsideUnitID=12345678");
    String str =
        MessageFormat.format(
            "{0}?serviceLocationID={1}&roadsideUnitID={2}",
            endpoint,
            URLEncoder.encode("あいうえお", StandardCharsets.UTF_8),
            URLEncoder.encode("あいうえお", StandardCharsets.UTF_8));
    URI expectedEncoded = URI.create(str);
    assertEquals(expected, targetInfoApiClient.createUri(endpoint, "16777215", "12345678"));
    assertEquals(expectedEncoded, targetInfoApiClient.createUri(endpoint, "あいうえお", "あいうえお"));
  }

  @Test
  void getTargetInfo() {
    // プロパティに記載されたroadsideUnitIdの件数分呼ばれていること
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
    assertFalse(targetInfoApiConfig.debugAuthSkip());
    mockServerClient.when(getLoginRequest(authApiConfig)).respond(getLoginResponseOk());
    // TargetInfoApi 呼ばれない
    mockServerClient
        .when(getTargetInfoRequest12345678(targetInfoApiConfig))
        .respond(getTargetInfoResponseExample());

    // 期限切れの場合はRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          targetInfoApiClient.getTargetInfo(expiredTarget);
        });
    // リクエストが送信されていないこと
    mockServerClient.verify(getLoginRequest(authApiConfig), VerificationTimes.exactly(0));
    mockServerClient.verify(
        getTargetInfoRequest12345678(targetInfoApiConfig), VerificationTimes.exactly(0));

    // -------------------------
    // 2. 有効な日時を指定することでexecuteRetryableRequestAndSave()が実行されていることを確認する
    // -------------------------
    // 準備
    mockServerClient.reset();
    ZonedDateTime now = ZonedDateTime.now(targetInfoApiConfig.targetInfo().timeZoneToZoneId());
    String activeTarget = targetInfoApiClient.formatTargetDateTime(now);

    // AuthApi OK
    // debug-auth-skip=false
    assertFalse(targetInfoApiConfig.debugAuthSkip());
    mockServerClient.when(getLoginRequest(authApiConfig)).respond(getLoginResponseOk());
    // TargetInfoApi OK
    mockServerClient
        .when(getTargetInfoRequestAll(targetInfoApiConfig))
        .respond(getTargetInfoResponseExample());

    // 実行
    targetInfoApiClient.getTargetInfo(activeTarget);

    // 検証
    // リクエストがプロパティに記載された件数回送信されていること
    mockServerClient.verify(
        getLoginRequest(authApiConfig),
        VerificationTimes.exactly(targetInfoApiConfig.targetInfo().request().parameters().size()));
    mockServerClient.verify(
        getTargetInfoRequestAll(targetInfoApiConfig),
        VerificationTimes.exactly(targetInfoApiConfig.targetInfo().request().parameters().size()));
  }

  @Test
  void handleStatusCode() {
    // 200の場合は例外が発生しないこと
    try {
      targetInfoApiClient.handleStatusCode(200);
    } catch (Exception e) {
      fail("例外が発生しないこと");
    }
    // 400（Bad Request）はRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          targetInfoApiClient.handleStatusCode(400);
        });
    // 500（Internal Server Error）はRetryableRuntimeExceptionが発生すること
    assertThrows(
        RetryableRuntimeException.class,
        () -> {
          targetInfoApiClient.handleStatusCode(500);
        });
    // それ以外はRetryableRuntimeExceptionが発生すること
    assertThrows(
        RetryableRuntimeException.class,
        () -> {
          targetInfoApiClient.handleStatusCode(504);
        });
  }

  @Test
  void handleErrorCode() {
    // 例外が発生しないこと
    try {
      targetInfoApiClient.handleErrorCode(null);
    } catch (Exception e) {
      fail("例外が発生しないこと");
    }
  }

  @Test
  void handleVersion() {
    // 例外が発生しないこと
    try {
      targetInfoApiClient.handleVersion(null, null);
    } catch (Exception e) {
      fail("例外が発生しないこと");
    }
  }

  @Test
  void handleExpired() {
    // 基準日時(20241126000000)
    ZonedDateTime base =
        ZonedDateTime.of(
            2024, 11, 26, 0, 0, 0, 0, targetInfoApiConfig.targetInfo().timeZoneToZoneId());
    String baseStr = targetInfoApiClient.formatTargetDateTime(base);
    // timeoutナノ秒
    long timeoutNanos = targetInfoApiConfig.targetInfo().request().retry().timeoutNanos();

    // 期限が切れていない場合は例外は発生しないこと
    try {
      // 有効日時Max（基準日時からtimeoutナノ秒経過した日時）
      ZonedDateTime activeMax = base.plusNanos(timeoutNanos);
      logger.info("baseStr={}, activeMax={}", baseStr, activeMax);
      // 有効日時Maxの場合は例外は発生しない
      targetInfoApiClient.handleExpired(baseStr, activeMax);
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
          targetInfoApiClient.handleExpired(baseStr, expiredMin);
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
        .when(getTargetInfoRequest12345678(targetInfoApiConfig))
        .respond(getTargetInfoResponseExample());

    // 実行
    targetInfoApiClient.request(
        oKtargetDate,
        targetInfoApiClient.createUri(
            targetInfoApiConfig.targetInfo().request().endpoint(), "16777215", "12345678"),
        "accessToken");

    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(
        getTargetInfoRequest12345678(targetInfoApiConfig), VerificationTimes.exactly(1));

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
        .when(getTargetInfoRequest12345678(targetInfoApiConfig))
        .respond(getTargetInfoResponseRetryableStatusCode());

    // 実行
    assertThrows(
        RetryableRuntimeException.class,
        () -> {
          targetInfoApiClient.request(
              retryTargetDate,
              targetInfoApiClient.createUri(
                  targetInfoApiConfig.targetInfo().request().endpoint(), "16777215", "12345678"),
              "accessToken");
        });
    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(
        getTargetInfoRequest12345678(targetInfoApiConfig), VerificationTimes.exactly(1));
  }

  @Test
  void save() throws IOException {
    // -------------------------
    // 1. 書き込み成功した場合、保存したファイルの中身が一致していること
    // -------------------------
    // 準備
    String formattedTargetDateTime = "save";
    String serviceLocationId = "16777215";
    String roadsideUnitId = "12345678";
    String responseBody = "test save()";

    // 実行
    targetInfoApiClient.save(
        formattedTargetDateTime, serviceLocationId, roadsideUnitId, responseBody);

    // 検証
    try {
      // 保存されたファイルの中身が一致していること
      String actual =
          Files.readString(
              targetInfoApiClient.getSaveFilePath(
                  formattedTargetDateTime, serviceLocationId, roadsideUnitId));
      assertEquals(responseBody, actual);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }

    // -------------------------
    // 2. IOExceptionが発生した場合はRuntimeExceptionにする
    // -------------------------
    // 準備
    String invalid = "invalid";
    Path invalidFilePath = targetInfoApiClient.getSaveFilePath(invalid, invalid, invalid);
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
              targetInfoApiClient.save(invalid, invalid, invalid, invalid);
            });
    assertTrue(e.getCause() instanceof IOException);
  }

  @Test
  void getSaveFilePath() {
    // target.tier4.target-info-api.target-info.response.save.directoryとファイル名を結合したパスが取得できること
    String formattedTargetDateTime = "formattedTargetDateTime";
    String serviceLocationId = "serviceLocationId";
    String roadsideUnitId = "roadsideUnitId";
    String fileName =
        MessageFormat.format(
            "targetinfo_{0}_{1}_{2}.json",
            serviceLocationId, roadsideUnitId, formattedTargetDateTime);
    Path expected =
        Path.of(
            targetInfoApiConfig.targetInfo().response().save().directory(),
            formattedTargetDateTime,
            fileName);
    Path actual =
        targetInfoApiClient.getSaveFilePath(
            formattedTargetDateTime, serviceLocationId, roadsideUnitId);
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
    assertFalse(targetInfoApiConfig.debugAuthSkip());
    mockServerClient.when(getLoginRequest(authApiConfig)).respond(getLoginResponseOk());
    // TargetInfoApi OK
    mockServerClient
        .when(getTargetInfoRequest12345678(targetInfoApiConfig))
        .respond(getTargetInfoResponseExample());

    // 実行
    targetInfoApiClient.executeRetryableRequestAndSave(
        targetDate, targetInfoApiConfig.targetInfo().request().endpoint(), "16777215", "12345678");

    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(getLoginRequest(authApiConfig), VerificationTimes.exactly(1));
    mockServerClient.verify(
        getTargetInfoRequest12345678(targetInfoApiConfig), VerificationTimes.exactly(1));
    // 保存されたファイルの中身が一致していること
    try {
      String expected = getTargetInfoResponseExample().getBodyAsString();
      String actual =
          Files.readString(targetInfoApiClient.getSaveFilePath(targetDate, "16777215", "12345678"));
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
    assertFalse(targetInfoApiConfig.debugAuthSkip());
    mockServerClient.when(getLoginRequest(authApiConfig)).respond(getLoginResponseOk());
    // TargetInfoApi OK 1回目はリトライ 2回目はOK
    AtomicInteger requestCount = new AtomicInteger(0);
    mockServerClient
        .when(getTargetInfoRequest12345678(targetInfoApiConfig))
        .respond(
            request -> {
              int count = requestCount.incrementAndGet();
              if (count == 1) {
                // 1回目はリトライが発生するステータスコードを返す
                logger.info("リトライ発生");
                return getTargetInfoResponseRetryableStatusCode();
              } else {
                return getTargetInfoResponseExample();
              }
            });

    // 実行
    targetInfoApiClient.executeRetryableRequestAndSave(
        retryTargetDate,
        targetInfoApiConfig.targetInfo().request().endpoint(),
        "16777215",
        "12345678");
    // 検証
    // リクエストが2回送信されていること
    mockServerClient.verify(getLoginRequest(authApiConfig), VerificationTimes.exactly(2));
    mockServerClient.verify(
        getTargetInfoRequest12345678(targetInfoApiConfig), VerificationTimes.exactly(2));
    // 保存されたファイルの中身が一致していること
    try {
      String actual =
          Files.readString(
              targetInfoApiClient.getSaveFilePath(retryTargetDate, "16777215", "12345678"));
      assertEquals(getTargetInfoResponseExample().getBodyAsString(), actual);
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
    assertFalse(targetInfoApiConfig.debugAuthSkip());
    mockServerClient.when(getLoginRequest(authApiConfig)).respond(getLoginResponseOk());
    // TargetInfoApi NG タイムアウトするまでリトライ
    mockServerClient
        .when(getTargetInfoRequest12345678(targetInfoApiConfig))
        .respond(getTargetInfoResponseRetryableStatusCode());

    // 実行
    // リトライがタイムアウトした場合はRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          targetInfoApiClient.executeRetryableRequestAndSave(
              timeoutTargetDate,
              targetInfoApiConfig.targetInfo().request().endpoint(),
              "16777215",
              "12345678");
        });
    // タイムアウトするまで複数回リトライしていること（リクエストが2回以上送信されていること）
    mockServerClient.verify(getLoginRequest(authApiConfig), VerificationTimes.atLeast(2));
    mockServerClient.verify(
        getTargetInfoRequest12345678(targetInfoApiConfig), VerificationTimes.atLeast(2));

    // -------------------------
    // 4. NG_HTTPリクエストがタイムアウトした場合はリトライせずにRuntimeExceptionが発生すること
    // -------------------------
    String requestTimeoutTargetDate = "executeRetryableRequestAndSave_RequestTimeout";
    mockServerClient.reset(); // 最初に設定したものが優先されるためリセットする
    // AuthApi OK
    // debug-auth-skip=false
    assertFalse(targetInfoApiConfig.debugAuthSkip());
    mockServerClient.when(getLoginRequest(authApiConfig)).respond(getLoginResponseOk());
    // TargetInfoApi NG
    mockServerClient
        .when(getTargetInfoRequest12345678(targetInfoApiConfig))
        .respond(getTargetInfoResponseWaitRequestTimeout(targetInfoApiConfig));

    // 実行
    // HTTPリクエストがタイムアウトした場合はRuntimeExceptionが発生すること
    // request.timeout < retry.timeout　であること
    long requestTimeout = targetInfoApiConfig.targetInfo().request().timeoutNanos();
    long retryTimeout = targetInfoApiConfig.targetInfo().request().retry().timeoutNanos();
    assertTrue(requestTimeout < retryTimeout);
    assertThrows(
        RuntimeException.class,
        () -> {
          targetInfoApiClient.executeRetryableRequestAndSave(
              requestTimeoutTargetDate,
              targetInfoApiConfig.targetInfo().request().endpoint(),
              "16777215",
              "12345678");
        });
    // HTTPリクエストがタイムアウトしたこと（リクエストが1回送信されていること）
    mockServerClient.verify(getLoginRequest(authApiConfig), VerificationTimes.exactly(1));
    mockServerClient.verify(
        getTargetInfoRequest12345678(targetInfoApiConfig), VerificationTimes.exactly(1));
  }
}

@MockServerTest({
  CustomProperties.TARGET_AUTH_API_LOGIN_REQUEST_ENDPOINT,
  CustomProperties.TARGET_TIER_4_TARGET_INFO_API_TARGET_INFO_REQUEST_ENDPOINT
})
@SpringBootTest
@ActiveProfiles({"ut", "debug-auth-skip-true"})
class DebugAuthSkipTrueTest {

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;

  @Autowired private TargetInfoApiClient targetInfoApiClient;
  @Autowired private TargetInfoApiConfig targetInfoApiConfig;
  @Autowired private AuthApiConfig authApiConfig;

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) throws URISyntaxException {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(
        DynamicPropertySourceTestHelper.Keys.TARGET_TIER_4_TARGET_INFO_API_KEY, () -> "TEST");
    registry.add(
        DynamicPropertySourceTestHelper.Keys.TARGET_VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET,
        () -> "TEST");
    registry.add(
        DynamicPropertySourceTestHelper.Keys.TARGET_VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD,
        () -> "TEST");
    registry.add(DynamicPropertySourceTestHelper.Keys.TARGET_AUTH_API_LOGIN_KEY, () -> "TEST");
    registry.add(
        DynamicPropertySourceTestHelper.Keys
            .TARGET_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID,
        () -> "TEST");
    registry.add(
        DynamicPropertySourceTestHelper.Keys
            .TARGET_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD,
        () -> "TEST");
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
    assertTrue(targetInfoApiConfig.debugAuthSkip());
    mockServerClient.when(getLoginRequest(authApiConfig)).respond(getLoginResponseOk());
    // TargetInfoApi OK
    mockServerClient
        .when(getTargetInfoRequest12345678(targetInfoApiConfig))
        .respond(getTargetInfoResponseExample());

    // 実行
    targetInfoApiClient.executeRetryableRequestAndSave(
        targetDate, targetInfoApiConfig.targetInfo().request().endpoint(), "16777215", "12345678");

    // 検証
    // AuthApiにリクエストが送信されていないこと
    mockServerClient.verify(getLoginRequest(authApiConfig), VerificationTimes.exactly(0));
    // TargetInfoApiにリクエストが1回送信されていること
    mockServerClient.verify(
        getTargetInfoRequest12345678(targetInfoApiConfig), VerificationTimes.exactly(1));
    // 保存されたファイルの中身が一致していること
    try {
      String expected = getTargetInfoResponseExample().getBodyAsString();
      String actual =
          Files.readString(targetInfoApiClient.getSaveFilePath(targetDate, "16777215", "12345678"));
      assertEquals(expected, actual);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  void delayIfLessThanOneSecond() {
    // 準備
    Instant start = Instant.now();
    // 実行
    targetInfoApiClient.delayIfLessThanOneSecond(start);
    // 検証
    Instant end = Instant.now();
    Duration duration = Duration.between(start, end);
    // 1000ms以上経過していること
    Assertions.assertTrue(duration.toMillis() >= 1000);
  }
}
