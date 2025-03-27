package com.nttdata.vehicleinfo.collection.weatherinformationcollector.service;

import static com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.DynamicPropertySourceTestHelper.Keys.*;
import static com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.MockServerTestHelper.*;
import static com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.MockServerTestHelper.getWimage72ResponseOk;
import static com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.Wimage72ResponseParserTestHelper.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.nttdata.vehicleinfo.collection.weatherinformationcollector.config.DreamApiConfig;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.exception.RetryableRuntimeException;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.parser.Wimage72ResponseParser;
import java.io.File;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.concurrent.CompletionException;
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
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@MockServerTest({CustomProperties.HALEX_DREAM_API_WIMAGE72_REQUEST_ENDPOINT})
@SpringBootTest
class DreamApiClientTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;

  @Autowired private DreamApiClient dreamApiClient;
  @Autowired private DreamApiConfig dreamApiConfig;

  @DynamicPropertySource
  static void defaultDynamicProperties(DynamicPropertyRegistry registry) {
    try {
      // 環境変数の設定が必須のプロパティを設定
      registry.add(HALEX_DREAM_API_KEY, () -> "TEST");
      registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
      registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
      registry.add(AUTH_API_LOGIN_KEY, () -> "TEST");
      registry.add(AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID, () -> "TEST");
      registry.add(AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD, () -> "TEST");

      String saveDir =
          new File(
                  DreamApiClientTest.class
                      .getClassLoader()
                      .getResource("")
                      .toURI()
                      .resolve("DreamApiClientTest"))
              .toString();
      registry.add(HALEX_DREAM_API_WIMAGE72_RESPONSE_SAVE_DIRECTORY, () -> saveDir);
    } catch (URISyntaxException e) {
      throw new RuntimeException(e);
    }
  }

  @BeforeEach
  void before() throws IOException {
    // レスポンスの保存ディレクトリを空にする
    String dir = dreamApiConfig.wimage72().response().save().directory();
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
  void formatTargetDateTime() {
    // 2024年01月07日01時02分（タイムゾーンはDreamApiConfig参照）
    ZonedDateTime t =
        ZonedDateTime.of(2024, 1, 7, 1, 2, 0, 0, dreamApiConfig.wimage72().timeZoneToZoneId());

    // 202401070100になること
    assertEquals("202401070100", dreamApiClient.formatTargetDateTime(t));

    // 異なるタイムゾーンに変換しても結果が同じになること
    ZonedDateTime jst = t.withZoneSameInstant(ZoneId.of("Asia/Tokyo"));
    ZonedDateTime utc = t.withZoneSameInstant(ZoneId.of("UTC"));
    assertEquals("202401070100", dreamApiClient.formatTargetDateTime(jst));
    assertEquals("202401070100", dreamApiClient.formatTargetDateTime(utc));
  }

  @Test
  void getWimage72Service() {
    // 1. 期限切れの対象日時を指定した場合はリクエストが送信されないこと
    // 2. 設定ファイルに記載された座標の件数分のリクエストが送信されていること
    // 3. 1件でもリクエストが失敗した場合はRuntimeExceptionが発生すること

    // -------------------------
    // 1. 期限切れの対象日時を指定した場合はリクエストが送信されないこと
    // -------------------------
    // 準備
    String expiredTarget = "19700101000000";
    mockServerClient
        .when(getWimage72RequestWithQuery(dreamApiConfig))
        .respond(getWimage72ResponseOk());
    // DreamApi 呼ばれない
    mockServerClient
        .when(getWimage72RequestWithQuery(dreamApiConfig))
        .respond(getWimage72ResponseOk());

    // 期限切れの場合はRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          dreamApiClient.getWimage72Service(expiredTarget);
        });
    // リクエストが送信されていないこと
    mockServerClient.verify(
        getWimage72RequestWithQuery(dreamApiConfig), VerificationTimes.exactly(0));

    // -------------------------
    // 2. 設定ファイルに記載された座標分のリクエストが送信されていること
    // -------------------------
    // 準備
    mockServerClient.reset();
    ZonedDateTime now = ZonedDateTime.now(dreamApiConfig.wimage72().timeZoneToZoneId());
    String activeTarget = dreamApiClient.formatTargetDateTime(now);

    // TargetInfoApi OK
    mockServerClient
        .when(getWimage72RequestWithQuery(dreamApiConfig))
        .respond(getWimage72ResponseOk(RESPONSE_OK_TARGET_DATE_TIME, activeTarget));

    // 実行
    dreamApiClient.getWimage72Service(activeTarget);

    // 検証
    // リクエストがプロパティに記載された件数回送信されていること
    mockServerClient.verify(
        getWimage72RequestWithQuery(dreamApiConfig),
        VerificationTimes.exactly(dreamApiConfig.wimage72().request().coordinates().size()));

    // -------------------------
    // 3. 1件でもリクエストが失敗した場合はRuntimeExceptionが発生すること
    // -------------------------
    // 準備
    mockServerClient.reset();
    ZonedDateTime nowNgOnce = ZonedDateTime.now(dreamApiConfig.wimage72().timeZoneToZoneId());
    String activeTargetNgOnce = dreamApiClient.formatTargetDateTime(nowNgOnce);

    // DreamApi OK 1回目はリトライ不可 2回目以降はOK
    AtomicInteger requestCount = new AtomicInteger(0);
    mockServerClient
        .when(getWimage72RequestWithQuery(dreamApiConfig))
        .respond(
            request -> {
              int count = requestCount.incrementAndGet();
              if (count == 1) {
                return getWimage72ResponseOkError();
              } else {
                return getWimage72ResponseOk(RESPONSE_OK_TARGET_DATE_TIME, activeTargetNgOnce);
              }
            });

    // 実行
    RuntimeException e =
        assertThrows(
            RuntimeException.class, () -> dreamApiClient.getWimage72Service(activeTargetNgOnce));
    logger.info(e.getMessage());
    // 検証
    // リクエストがプロパティに記載された件数回送信されていること
    mockServerClient.verify(
        getWimage72RequestWithQuery(dreamApiConfig),
        VerificationTimes.exactly(dreamApiConfig.wimage72().request().coordinates().size()));
  }

  @Test
  void init() throws IOException {
    // 準備
    String dir = dreamApiConfig.wimage72().response().save().directory();
    Path path = Paths.get(dir);
    // 実行
    dreamApiClient.init();
    // 検証
    // ディレクトリが存在しない場合は作成されること
    assertTrue(Files.exists(path));
    // 既に存在している場合はエラーにならないこと
    dreamApiClient.init();
  }

  @Test
  void handleStatusCode() {
    // 200の場合はエラーがでないこと
    dreamApiClient.handleStatusCode(200);
    // 200以外はRetryableRuntimeExceptionが発生すること
    assertThrows(
        RetryableRuntimeException.class,
        () -> {
          dreamApiClient.handleStatusCode(404);
        });
  }

  @Test
  void handleErrorCode() {
    // リトライ可能なエラー（ERR-014）の場合はRetryableRuntimeExceptionが発生すること
    Wimage72ResponseParser response = getWimage72ResponseRetryableError();
    assertThrows(
        RetryableRuntimeException.class,
        () -> {
          dreamApiClient.handleErrorCode(response);
        });
    // リトライ不可能なエラー（ERR-014以外）の場合はRuntimeExceptionが発生すること
    Wimage72ResponseParser response2 = getWimage72ResponseError();
    assertThrows(
        RuntimeException.class,
        () -> {
          dreamApiClient.handleErrorCode(response2);
        });
  }

  @Test
  void handleVersion() {
    try {
      String json =
          Files.readString(
              Path.of(
                  DreamApiClientTest.class
                      .getClassLoader()
                      .getResource(
                          "data/halex-dreamapi/wimage72-service/202409040000/lat35.73243_lon139.71547.json")
                      .toURI()));
      Wimage72ResponseParser response = new Wimage72ResponseParser(json);
      // バージョンが一致している場合は例外は発生しない
      dreamApiClient.handleVersion(response, "202409040000");
      // バージョンが不一致の場合はRetryableRuntimeExceptionが発生すること
      assertThrows(
          RetryableRuntimeException.class,
          () -> {
            dreamApiClient.handleVersion(response, "202409040100");
          });
    } catch (IOException | URISyntaxException e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  void handleExpired() {
    // 期限が切れていない場合は例外は発生しないこと
    ZonedDateTime now = ZonedDateTime.now(dreamApiConfig.wimage72().timeZoneToZoneId());
    String nowDateTime = dreamApiClient.formatTargetDateTime(now);
    try {
      dreamApiClient.handleExpired(nowDateTime);
    } catch (Exception e) {
      fail("期限が切れていない場合は例外は発生しない");
    }

    // 期限切れの場合はRuntimeExceptionが発生すること
    String over = dreamApiClient.formatTargetDateTime(now.minusHours(1));
    assertThrows(
        RuntimeException.class,
        () -> {
          dreamApiClient.handleExpired(over);
        });
  }

  @Test
  void request() {
    // 1. ステータスコードがOK、かつ、エラーコードがなし、かつ、バージョンが一致する場合はレスポンスが取得できること
    // 2. ステータスコードがNGの場合はRetryableRuntimeExceptionが発生すること
    // 3. ステータスコードがOK、かつ、エラーコードがある場合、かつ、リトライが発生しない場合はRuntimeExceptionが発生すること
    // 4. ステータスコードがOK、かつ、エラーコードがある場合、かつ、リトライが発生する場合はRetryableRuntimeExceptionが発生すること
    // 5. ステータスコードがOK、かつ、エラーコードがなし、かつ、バージョンが一致しない場合はRuntimeExceptionが発生すること
    // 6. HTTPリクエストがタイムアウトした場合はCompletionExceptionが発生すること
    String formattedTargetDateTime = RESPONSE_OK_TARGET_DATE_TIME;
    // -------------------------
    // 1. ステータスコードがOK、かつ、エラーコードがなし、かつ、バージョンが一致する場合はレスポンスが取得できること
    // -------------------------
    // 準備
    mockServerClient.when(getWimage72Request(dreamApiConfig)).respond(getWimage72ResponseOk());

    // 実行
    String actualOk =
        dreamApiClient.request(
            formattedTargetDateTime, dreamApiConfig.wimage72().request().endpointUri());

    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(getWimage72Request(dreamApiConfig), VerificationTimes.exactly(1));
    assertEquals(getWimage72ResponseOk().getBodyAsString(), actualOk);

    // -------------------------
    // 2. ステータスコードがNGの場合はRetryableRuntimeExceptionが発生すること
    // -------------------------
    // 準備
    mockServerClient.reset();
    mockServerClient.when(getWimage72Request(dreamApiConfig)).respond(getWimage72ResponseNg());

    // 実行
    assertThrows(
        RetryableRuntimeException.class,
        () -> {
          dreamApiClient.request(
              formattedTargetDateTime, dreamApiConfig.wimage72().request().endpointUri());
        });
    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(getWimage72Request(dreamApiConfig), VerificationTimes.exactly(1));

    // -------------------------
    // 3. ステータスコードがOK、かつ、エラーコードがある場合、かつ、リトライが発生しない場合はRuntimeExceptionが発生すること
    // -------------------------
    // 準備
    mockServerClient.reset();
    mockServerClient.when(getWimage72Request(dreamApiConfig)).respond(getWimage72ResponseOkError());

    // 実行
    assertThrows(
        RuntimeException.class,
        () -> {
          dreamApiClient.request(
              formattedTargetDateTime, dreamApiConfig.wimage72().request().endpointUri());
        });
    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(getWimage72Request(dreamApiConfig), VerificationTimes.exactly(1));

    // -------------------------
    // 4. ステータスコードがOK、かつ、エラーコードがある場合、かつ、リトライが発生する場合はRetryableRuntimeExceptionが発生すること
    // -------------------------
    // 準備
    mockServerClient.reset();
    mockServerClient
        .when(getWimage72Request(dreamApiConfig))
        .respond(getWimage72ResponseOkRetryableError());

    // 実行
    assertThrows(
        RetryableRuntimeException.class,
        () -> {
          dreamApiClient.request(
              formattedTargetDateTime, dreamApiConfig.wimage72().request().endpointUri());
        });
    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(getWimage72Request(dreamApiConfig), VerificationTimes.exactly(1));

    // -------------------------
    // 5. ステータスコードがOK、かつ、エラーコードがなし、かつ、バージョンが一致しない場合はRuntimeExceptionが発生すること
    // -------------------------
    // 準備
    String invalidFormattedTargetDateTime = "invalid_version";
    mockServerClient.reset();
    mockServerClient.when(getWimage72Request(dreamApiConfig)).respond(getWimage72ResponseOk());

    // 実行
    assertThrows(
        RuntimeException.class,
        () -> {
          dreamApiClient.request(
              invalidFormattedTargetDateTime, dreamApiConfig.wimage72().request().endpointUri());
        });
    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(getWimage72Request(dreamApiConfig), VerificationTimes.exactly(1));

    // 6. HTTPリクエストがタイムアウトした場合はHttpTimeoutExceptionが発生すること
    // 準備
    mockServerClient.reset();
    mockServerClient
        .when(getWimage72Request(dreamApiConfig))
        .respond(getWimage72ResponseWaitRequestTimeout(dreamApiConfig));

    // 実行
    assertThrows(
        CompletionException.class,
        () -> {
          dreamApiClient.request(
              formattedTargetDateTime, dreamApiConfig.wimage72().request().endpointUri());
        });
    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(getWimage72Request(dreamApiConfig), VerificationTimes.exactly(1));
  }

  @Test
  void save() {
    // 準備
    String formattedTargetDateTime = "save";
    DreamApiConfig.Wimage72.Request.Coordinate coordinate =
        new DreamApiConfig.Wimage72.Request.Coordinate(0.0, 1.1);
    String responseBody = "test save()";

    // 実行
    dreamApiClient.save(formattedTargetDateTime, coordinate, responseBody);

    // 検証
    try {
      // 保存されたファイルの中身が一致していること
      String actual =
          Files.readString(
              Path.of(
                  DreamApiClientTest.class
                      .getClassLoader()
                      .getResource("DreamApiClientTest/save/lat0.0_lon1.1.json")
                      .toURI()));
      assertEquals(responseBody, actual);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  void createCommonUrlBuilder() {
    String actual =
        dreamApiConfig.wimage72().request().endpoint()
            + "?key=TEST&sid=wimage72-service&rem=all&proj=0";
    assertEquals(dreamApiClient.createCommonUrlBuilder().toString(), actual);
  }

  @Test
  void createUri() {
    StringBuilder testBuilder = new StringBuilder("test");
    DreamApiConfig.Wimage72.Request.Coordinate coordinate =
        new DreamApiConfig.Wimage72.Request.Coordinate(0.0, 1.1);
    assertEquals(
        dreamApiClient.createUri(testBuilder, coordinate).toString(), "test&lat=0.0&lon=1.1");
  }

  @Test
  void delayIfLessThanOneSecond() {
    // 準備
    Instant start = Instant.now();
    // 実行
    dreamApiClient.delayIfLessThanOneSecond(start);
    // 検証
    Instant end = Instant.now();
    Duration duration = Duration.between(start, end);
    // 1000ms以上経過していること
    assertTrue(duration.toMillis() >= 1000);
  }

  @Test
  void executeRetryableRequestAndSave() {
    // 1. OK_レスポンスボディがファイルに保存されていること
    // 2. OK_リトライありでレスポンスボディがファイルに保存されていること
    // 3. NG_リトライがタイムアウトした場合はRuntimeExceptionが発生すること
    // 4. NG_リトライなしでRuntimeExceptionが発生すること

    // 設定ファイルの1件目の座標
    DreamApiConfig.Wimage72.Request.Coordinate coordinate =
        dreamApiConfig.wimage72().request().coordinates().getFirst();
    // 設定ファイルの1件目の座標がテストデータと一致すること
    assertEquals(coordinate.getFileName(), RESPONSE_OK_FILE_NAME);

    // -------------------------
    // 1. OK_レスポンスボディがファイルに保存されていること
    // -------------------------
    // 準備
    // DreamApi OK
    mockServerClient
        .when(getWimage72RequestWithQuery(dreamApiConfig))
        .respond(getWimage72ResponseOk());

    // 実行
    dreamApiClient.executeRetryableRequestAndSave(
        RESPONSE_OK_TARGET_DATE_TIME, dreamApiClient.createCommonUrlBuilder(), coordinate);

    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(
        getWimage72RequestWithQuery(dreamApiConfig), VerificationTimes.exactly(1));
    // 保存されたファイルの中身が一致していること
    try {
      String expected = getWimage72ResponseOk().getBodyAsString();
      String actual =
          Files.readString(
              dreamApiClient.getSaveFilePath(RESPONSE_OK_TARGET_DATE_TIME, coordinate));
      assertEquals(expected, actual);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }

    // -------------------------
    // 2. OK_リトライありでレスポンスボディがファイルに保存されていること
    // -------------------------
    // 準備
    mockServerClient.reset(); // 最初に設定したものが優先されるためリセットする
    // DreamApi OK 1回目はリトライ 2回目はOK
    AtomicInteger requestCount = new AtomicInteger(0);
    mockServerClient
        .when(getWimage72RequestWithQuery(dreamApiConfig))
        .respond(
            request -> {
              int count = requestCount.incrementAndGet();
              if (count == 1) {
                // 1回目はリトライが発生するステータスコードを返す
                logger.info("リトライ発生");
                return getWimage72ResponseRetryableStatusCode();
              } else {
                return getWimage72ResponseOk();
              }
            });
    // 実行
    dreamApiClient.executeRetryableRequestAndSave(
        RESPONSE_OK_TARGET_DATE_TIME, dreamApiClient.createCommonUrlBuilder(), coordinate);

    // 検証
    // リクエストが2回送信されていること
    mockServerClient.verify(
        getWimage72RequestWithQuery(dreamApiConfig), VerificationTimes.exactly(2));
    // 保存されたファイルの中身が一致していること
    try {
      String expected = getWimage72ResponseOk().getBodyAsString();
      String actual =
          Files.readString(
              dreamApiClient.getSaveFilePath(RESPONSE_OK_TARGET_DATE_TIME, coordinate));
      assertEquals(expected, actual);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }

    // -------------------------
    // 3. NG_リトライがタイムアウトした場合はRuntimeExceptionが発生すること
    // -------------------------
    // 準備
    mockServerClient.reset(); // 最初に設定したものが優先されるためリセットする
    // DreamApi NG タイムアウトするまでリトライ
    mockServerClient
        .when(getWimage72RequestWithQuery(dreamApiConfig))
        .respond(getWimage72ResponseRetryableStatusCode());
    // 実行
    assertThrows(
        RuntimeException.class,
        () -> {
          dreamApiClient.executeRetryableRequestAndSave(
              RESPONSE_OK_TARGET_DATE_TIME, dreamApiClient.createCommonUrlBuilder(), coordinate);
        });
    // 検証
    // タイムアウトするまで複数回リトライしていること（リクエストが2回以上送信されていること）
    mockServerClient.verify(
        getWimage72RequestWithQuery(dreamApiConfig), VerificationTimes.atLeast(2));

    // -------------------------
    // 4. NG_リトライなしでRuntimeExceptionが発生すること
    // -------------------------
    // 準備
    mockServerClient.reset(); // 最初に設定したものが優先されるためリセットする
    // DreamApi NG リトライしないエラーコード
    mockServerClient
        .when(getWimage72RequestWithQuery(dreamApiConfig))
        .respond(getWimage72ResponseOkError());
    // 実行
    assertThrows(
        RuntimeException.class,
        () -> {
          dreamApiClient.executeRetryableRequestAndSave(
              RESPONSE_OK_TARGET_DATE_TIME, dreamApiClient.createCommonUrlBuilder(), coordinate);
        });
    // 検証
    // リクエストが1回送信されていること
    mockServerClient.verify(
        getWimage72RequestWithQuery(dreamApiConfig), VerificationTimes.exactly(1));
  }
}
