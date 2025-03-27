package com.nttdata.vehicleinfo.collection.weatherinformationcollector.scheduler;

import static com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.DynamicPropertySourceTestHelper.Keys.AUTH_API_LOGIN_KEY;
import static com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.DynamicPropertySourceTestHelper.Keys.AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD;
import static com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.DynamicPropertySourceTestHelper.Keys.AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID;
import static com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.DynamicPropertySourceTestHelper.Keys.AXISPOT_GEOTEMP_CONFIG;
import static com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.DynamicPropertySourceTestHelper.Keys.HALEX_DREAM_API_KEY;
import static com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.DynamicPropertySourceTestHelper.Keys.HALEX_DREAM_API_WIMAGE72_RESPONSE_SAVE_DIRECTORY;
import static com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.DynamicPropertySourceTestHelper.Keys.VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET;
import static com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.DynamicPropertySourceTestHelper.Keys.VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.nttdata.vdl.api.client.VdlApiConfig;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.config.AxispotConfig;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.config.DreamApiConfig;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.config.WeatherVdlApiConfig;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.service.DreamApiClient;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.AxispotTestHelper;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.ContainerConfig;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.MockServerTestHelper;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.test.Wimage72ResponseParserTestHelper;
import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Properties;
import java.util.Set;
import java.util.UUID;
import jp.co.ntt.sic.MovingObjectStoreData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mockserver.client.MockServerClient;
import org.mockserver.springtest.MockServerTest;
import org.mockserver.verify.VerificationTimes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.JsonNode;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

@MockServerTest({
  MockServerTestHelper.CustomProperties.HALEX_DREAM_API_WIMAGE72_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VDL_API_TOKEN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VDL_API_DATA_REQUEST_ENDPOINT
})
@SpringBootTest
@Import(ContainerConfig.class)
class WeatherInformationCollectingTaskTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;
  @Autowired private WeatherInformationCollectingTask task;
  @Autowired private DreamApiClient dreamApiClient;
  @Autowired private DreamApiConfig dreamApiConfig;
  @Autowired private AxispotConfig axispotConfig;
  @Autowired private GenericContainer<?> weathersAxispotRedis;
  @Autowired private WeatherVdlApiConfig weatherVdlApiConfig;

  private VdlApiConfig vdlApiConfig;

  @PostConstruct
  void init() {
    vdlApiConfig = weatherVdlApiConfig.getApi();
  }

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) throws URISyntaxException {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(HALEX_DREAM_API_KEY, () -> "TEST");
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
    registry.add(AUTH_API_LOGIN_KEY, () -> "TEST");
    registry.add(AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID, () -> "TEST");
    registry.add(AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD, () -> "TEST");

    // 他プロパティを設定
    String saveDir =
        new File(
                WeatherInformationCollectingTaskTest.class
                    .getClassLoader()
                    .getResource("data/halex-dreamapi/wimage72-service")
                    .toURI())
            .toString();
    String geotempConfig =
        new File(
                WeatherInformationCollectingTaskTest.class
                    .getClassLoader()
                    .getResource("axispot/geotempConfig.properties")
                    .toURI())
            .toString();
    registry.add(HALEX_DREAM_API_WIMAGE72_RESPONSE_SAVE_DIRECTORY, () -> saveDir);
    registry.add(AXISPOT_GEOTEMP_CONFIG, () -> geotempConfig);
    logger.info(registry.toString());
  }

  @BeforeAll
  static void setup(
      @Autowired AxispotConfig axsipotConfig, @Autowired GenericContainer<?> weathersAxispotRedis) {
    String config = axsipotConfig.geotemp().config();
    try (FileInputStream input = new FileInputStream(config)) {
      Properties properties = new Properties();
      properties.load(input);
      // コンテナのホスト名とRedisのポート6379とバインドしたポートを取得する
      String storeNodeInfo =
          weathersAxispotRedis.getHost() + ":" + weathersAxispotRedis.getMappedPort(6379);
      // geotempConifg.propertiesを上書き
      properties.setProperty("storeNodeInfo", storeNodeInfo);
      try (FileOutputStream output = new FileOutputStream(config)) {
        properties.store(output, "Test Container properties");
      }
    } catch (FileNotFoundException e) {
      throw new RuntimeException(e);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  void execute() throws InterruptedException {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();

      // 5秒後の日時を計算して、それまで待機することで対象日時をコントロールする
      ZonedDateTime now = ZonedDateTime.now(dreamApiConfig.wimage72().timeZoneToZoneId());
      ZonedDateTime target = now.plusSeconds(5).minusNanos(now.getNano());
      Duration wait = Duration.between(now, target);
      String expectedFormattedTargetDate = dreamApiClient.formatTargetDateTime(target);
      logger.info("target={} now={} wait={}", target, now, wait.toMillis());

      // DreamApi OK
      // プロパティに記載された回数分呼ばれるが返すデータはすべて同じ
      mockServerClient
          .when(MockServerTestHelper.getWimage72Request(dreamApiConfig))
          .respond(
              MockServerTestHelper.getWimage72ResponseOk(
                  MockServerTestHelper.RESPONSE_OK_TARGET_DATE_TIME, expectedFormattedTargetDate));
      // VdlAuth OK
      mockServerClient
          .when(MockServerTestHelper.getVdlAuthRequest(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlAuthResponseOk());
      // VdlData OK
      mockServerClient
          .when(MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlDataResponsePostCreated201());

      // gradlewで実行した場合に5秒経過する前に実行されることがあるため1ms多めにスリープする
      Thread.sleep(wait.toMillis() + 1);

      // 実行
      task.execute();

      // 検証
      // DreamApiが設定ファイルの座標の件数分呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getWimage72Request(dreamApiConfig),
          VerificationTimes.exactly(dreamApiConfig.wimage72().request().coordinates().size()));

      // Axispotへの格納件数は実行された日時によって変動するため1件以上であることを確認する
      assertFalse(axispotTestHelper.getAll().isEmpty());

      // VdlAuthが設定ファイルの座標の件数分呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVdlAuthRequest(vdlApiConfig),
          VerificationTimes.exactly(dreamApiConfig.wimage72().request().coordinates().size()));
      // VdlDataが設定ファイルの座標の件数分呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig),
          VerificationTimes.exactly(dreamApiConfig.wimage72().request().coordinates().size()));
      // レスポンス保存ディレクトリが削除されていること
      assertFalse(
          Paths.get(
                  dreamApiConfig.wimage72().response().save().directory(),
                  expectedFormattedTargetDate)
              .toFile()
              .exists());
    }
  }

  @Test
  void saveToAxispot_OK_00時台の気象情報を格納する() {

    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();

      // 実行
      task.saveToAxispot("202409040000");

      // 検証

      // Axispot検索条件
      double lon = 139.71547;
      double lat = 35.73243;
      double alt = 0;
      int searchPrecision = 38;

      // 日時の範囲分のデータが1時間ごとに1件ずつ存在するか
      // start : 2024-09-04T00:00:00+09:00
      // end   : 2024-09-18T00:00:01+09:00 = start + 予測3日 + コピー11日 + 1秒
      Instant start = Instant.parse("2024-09-04T00:00:00+09:00");
      Instant end = Instant.parse("2024-09-18T00:00:01+09:00");
      for (Instant targetDateTime = start;
          targetDateTime.isBefore(end);
          targetDateTime = targetDateTime.plusSeconds(3600)) {
        int count =
            axispotTestHelper.count(
                targetDateTime.getEpochSecond(), lon, lat, alt, searchPrecision);
        assertEquals(1, count);
      }

      // データの件数が正しいか
      // 期待値 : 361件 = 実況1件 + 予測72件(24h*3d) + コピー288件（24h*12d）
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(361, result.size());
    } catch (Exception e) {
      Assertions.fail(e);
    }
  }

  @Test
  void saveToAxispot_OK_23時台の気象情報を格納する() {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();

      // 実行
      task.saveToAxispot("202409042300");

      // 検証

      // Axispot検索条件
      double lon = 139.71547;
      double lat = 35.73243;
      double alt = 0;
      int searchPrecision = 38;

      // 日時の範囲分のデータが1時間ごとに1件ずつ存在するか
      // start : 2024-09-04T23:00:00+09:00
      // end   : 2024-09-18T00:00:01+09:00 = startの0時0分0秒 + 予測3日 + コピー12日 + 1秒
      Instant start = Instant.parse("2024-09-04T23:00:00+09:00");
      Instant end = Instant.parse("2024-09-19T00:00:01+09:00");
      for (Instant targetDateTime = start;
          targetDateTime.isBefore(end);
          targetDateTime = targetDateTime.plusSeconds(3600)) {
        int count =
            axispotTestHelper.count(
                targetDateTime.getEpochSecond(), lon, lat, alt, searchPrecision);
        assertEquals(1, count);
      }

      // データの件数が正しいか
      // 期待値 : 338件 = 実況1件 + 予測49件(1h+24h*2d) + コピー288件（24h*12d）
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(338, result.size());
    } catch (Exception e) {
      Assertions.fail(e);
    }
  }

  @Test
  void saveToAxispot_OK_00時台と23時台の気象情報を格納する() {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();

      // 実行
      task.saveToAxispot("202409040000");
      task.saveToAxispot("202409042300");

      // 検証

      // Axispot検索条件
      double lon = 139.71547;
      double lat = 35.73243;
      double alt = 0;
      int searchPrecision = 38;

      // 日時の範囲分のデータが1時間ごとに1件ずつ存在するか
      // 2024-09-04 0時～22時 は1件
      // start : 2024-09-04T00:00:00+09:00
      // end   : 2024-09-04T22:00:01+09:00
      Instant start = Instant.parse("2024-09-04T00:00:00+09:00");
      Instant end = Instant.parse("2024-09-04T22:00:01+09:00");
      for (Instant targetDateTime = start;
          targetDateTime.isBefore(end);
          targetDateTime = targetDateTime.plusSeconds(3600)) {
        int count =
            axispotTestHelper.count(
                targetDateTime.getEpochSecond(), lon, lat, alt, searchPrecision);
        assertEquals(1, count);
      }

      // 日時の範囲分のデータが1時間ごとに2件ずつ存在するか
      // 2024-09-04 23時 から 2024-09-18 0時 は2件
      // start : 2024-09-04T23:00:00+09:00
      // end   : 2024-09-18T00:00:01+09:00
      Instant start2 = Instant.parse("2024-09-04T23:00:00+09:00");
      Instant end2 = Instant.parse("2024-09-18T00:00:01+09:00");
      for (Instant targetDateTime = start2;
          targetDateTime.isBefore(end2);
          targetDateTime = targetDateTime.plusSeconds(3600)) {
        int count =
            axispotTestHelper.count(
                targetDateTime.getEpochSecond(), lon, lat, alt, searchPrecision);
        assertEquals(2, count);
      }

      // データの件数が正しいか
      // 期待値 : 699件 = 361件(202409040000) + 338件(202409042300)
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(699, result.size());
    } catch (Exception e) {
      Assertions.fail(e);
    }
  }

  @Test
  void saveToAxispot_OK_illegal_location_spatial_id() {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();
      // テスト用ファイルが存在すること
      assertDoesNotThrow(() -> Wimage72ResponseParserTestHelper.getIllegalLocationSpatialIdOk00h());
      assertDoesNotThrow(() -> Wimage72ResponseParserTestHelper.getIllegalLocationSpatialId());

      // 実行
      task.saveToAxispot(
          Wimage72ResponseParserTestHelper.ILLEGAL_LOCATION_SPATIAL_ID_TARGET_DATE_TIME);

      // Redisの検索でデータの件数が正しいかを確認する
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      // 00Hの期待値 : 361件 = 実況1件 + 予測72件(24h*3d) + コピー288件（24h*12d）
      // 空間IDの範囲外の期待値 : 0件
      assertEquals(361, result.size());
    } catch (Exception e) {
      Assertions.fail(e);
    }
  }

  @Test
  void saveToAxispot_OK_illegal_location_axispot() {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();
      // テスト用ファイルが存在すること
      assertDoesNotThrow(() -> Wimage72ResponseParserTestHelper.getIllegalLocationAxispotOk00h());
      assertDoesNotThrow(() -> Wimage72ResponseParserTestHelper.getIllegalLocationAxispot());

      // 実行
      task.saveToAxispot(
          Wimage72ResponseParserTestHelper.ILLEGAL_LOCATION_AXISPOT_TARGET_DATE_TIME);

      // Redisの検索でデータの件数が正しいかを確認する
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      // 00Hの期待値 : 361件 = 実況1件 + 予測72件(24h*3d) + コピー266件（24h*12d）
      // Axispotの範囲外の期待値 : 0件
      assertEquals(361, result.size());
    } catch (Exception e) {
      Assertions.fail(e);
    }
  }

  @Test
  void saveRetryableToAxispot_NG_timeout() {
    // 実行と検証
    Exception e =
        Assertions.assertThrows(
            RuntimeException.class,
            () -> {
              task.saveRetryableToAxispot("INVALID");
            });

    assertEquals("タイムアウトしたためAxispotに格納失敗: targetDateTime=INVALID", e.getMessage());
  }

  @Test
  void saveRetryableToVdl_NG_timeout() {
    // 実行と検証
    Exception e =
        Assertions.assertThrows(
            RuntimeException.class,
            () -> {
              task.saveRetryableToVdl("INVALID");
            });

    assertEquals("タイムアウトしたためVDLに格納失敗: targetDateTime=INVALID", e.getMessage());
  }

  @Test
  void cleanUp() throws IOException {
    // 準備
    String targetDate = "TEST_202411010000";
    Path dir = Paths.get(dreamApiConfig.wimage72().response().save().directory(), targetDate);
    Files.createDirectory(dir);
    Path file = dir.resolve("test.txt");
    Files.writeString(file, "test");

    // 実行
    task.cleanUp(targetDate);

    // 検証
    Assertions.assertFalse(Files.exists(dir));
    Assertions.assertFalse(Files.exists(file));
  }

  @Test
  void getResponseFileList() {
    // 実行
    List<File> actual = task.getResponseFileList("202409040000");

    // 検証
    assertEquals(1, actual.size());
    assertEquals("lat35.73243_lon139.71547.json", actual.getFirst().getName());
  }

  @Test
  void getResponseFileList_NG_invalid() {
    // 実行と検証
    Assertions.assertThrows(
        RuntimeException.class,
        () -> {
          task.getResponseFileList("INVALID");
        });
  }

  @Test
  void getResponseFileList_NG_empty() throws IOException {
    // 準備
    String targetDate = "EMPTY_" + UUID.randomUUID();
    Path dir = Paths.get(dreamApiConfig.wimage72().response().save().directory(), targetDate);
    Files.createDirectory(dir);
    // 実行
    List<File> actual = task.getResponseFileList(targetDate);
    // 検証
    assertEquals(0, actual.size());
  }
}

@MockServerTest({
  MockServerTestHelper.CustomProperties.HALEX_DREAM_API_WIMAGE72_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VDL_API_TOKEN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VDL_API_DATA_REQUEST_ENDPOINT
})
@SpringBootTest
@Import(ContainerConfig.class)
@ActiveProfiles({"ut", "masking-enabled-true"})
class MaskingEnabledTrueTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;
  @Autowired private WeatherInformationCollectingTask task;
  @Autowired private DreamApiClient dreamApiClient;
  @Autowired private DreamApiConfig dreamApiConfig;
  @Autowired private AxispotConfig axispotConfig;
  @Autowired private GenericContainer<?> weathersAxispotRedis;
  @Autowired private WeatherVdlApiConfig weatherVdlApiConfig;

  private VdlApiConfig vdlApiConfig;

  @PostConstruct
  void init() {
    vdlApiConfig = weatherVdlApiConfig.getApi();
  }

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) throws URISyntaxException {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(HALEX_DREAM_API_KEY, () -> "TEST");
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
    registry.add(AUTH_API_LOGIN_KEY, () -> "TEST");
    registry.add(AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID, () -> "TEST");
    registry.add(AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD, () -> "TEST");

    // 他プロパティを設定
    String saveDir =
        new File(
                WeatherInformationCollectingTaskTest.class
                    .getClassLoader()
                    .getResource("data/halex-dreamapi/wimage72-service")
                    .toURI())
            .toString();
    String geotempConfig =
        new File(
                WeatherInformationCollectingTaskTest.class
                    .getClassLoader()
                    .getResource("axispot/geotempConfig.properties")
                    .toURI())
            .toString();
    registry.add(HALEX_DREAM_API_WIMAGE72_RESPONSE_SAVE_DIRECTORY, () -> saveDir);
    registry.add(AXISPOT_GEOTEMP_CONFIG, () -> geotempConfig);
    logger.info(registry.toString());
  }

  @BeforeAll
  static void setup(
      @Autowired AxispotConfig axsipotConfig, @Autowired GenericContainer<?> weathersAxispotRedis) {
    String config = axsipotConfig.geotemp().config();
    try (FileInputStream input = new FileInputStream(config)) {
      Properties properties = new Properties();
      properties.load(input);
      // コンテナのホスト名とRedisのポート6379とバインドしたポートを取得する
      String storeNodeInfo =
          weathersAxispotRedis.getHost() + ":" + weathersAxispotRedis.getMappedPort(6379);
      // geotempConifg.propertiesを上書き
      properties.setProperty("storeNodeInfo", storeNodeInfo);
      try (FileOutputStream output = new FileOutputStream(config)) {
        properties.store(output, "Test Container properties");
      }
    } catch (FileNotFoundException e) {
      throw new RuntimeException(e);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  // マスク処理のクエリ（application-masking-enabled-true.yamlと合わせること）
  String query =
      """
      .ActualInfos |= with_entries(.value.temperature = "11.1") |
      .ActualPrecipitation[] |= (.value="22.2") |
      .ForecastInfos |= with_entries(.value.temperature = "33.3")
      """;
  // マスク処理後の期待値
  // ForecastInfosが全件処理されていること
  // ActualInfos、ActualPrecipitationが空の場合は空のままであること
  String masked =
      """
      {"ActualInfos":{}, "ActualPrecipitation":[], "ForecastInfos":
        {"202409040100":
          {"humidity":"93.7", "temperature":"33.3", "temperatureSa":"-3.8", "weatherForecast":"200", "windDirection":"342.8", "windSpeed":"1.4"},
         "202409040200":
          {"humidity":"95.3", "temperature":"33.3", "temperatureSa":"-4.3", "weatherForecast":"300", "windDirection":"353.6", "windSpeed":"1.5"},
         "202409040300":
          {"humidity":"94.0", "temperature":"33.3", "temperatureSa":"-4.7", "weatherForecast":"300", "windDirection":"3.6", "windSpeed":"1.7"},
         "202409040400":
          {"humidity":"92.0", "temperature":"33.3", "temperatureSa":"-5.7", "weatherForecast":"300", "windDirection":"354.7", "windSpeed":"1.7"},
         "202409040500":
          {"humidity":"90.9", "temperature":"33.3", "temperatureSa":"-5.8", "weatherForecast":"300", "windDirection":"354.2", "windSpeed":"1.8"},
         "202409040600":
          {"humidity":"89.8", "temperature":"33.3", "temperatureSa":"-5.0", "weatherForecast":"200", "windDirection":"347.9", "windSpeed":"1.9"},
         "202409040700":
          {"humidity":"86.4", "temperature":"33.3", "temperatureSa":"-3.4", "weatherForecast":"200", "windDirection":"347.1", "windSpeed":"2.1"},
         "202409040800":
          {"humidity":"83.0", "temperature":"33.3", "temperatureSa":"-1.6", "weatherForecast":"200", "windDirection":"350.1", "windSpeed":"2.1"},
         "202409040900":
          {"humidity":"79.0", "temperature":"33.3", "temperatureSa":"-0.2", "weatherForecast":"200", "windDirection":"353.4", "windSpeed":"2.1"},
         "202409041000":
          {"humidity":"76.2", "temperature":"33.3", "temperatureSa":"0.2", "weatherForecast":"200", "windDirection":"1.2", "windSpeed":"2.1"},
         "202409041100":
          {"humidity":"75.1", "temperature":"33.3", "temperatureSa":"0.7", "weatherForecast":"200", "windDirection":"4.0", "windSpeed":"2.1"},
         "202409041200":
          {"humidity":"73.5", "temperature":"33.3", "temperatureSa":"1.0", "weatherForecast":"200", "windDirection":"8.5", "windSpeed":"2.2"},
         "202409041300":
          {"humidity":"72.3", "temperature":"33.3", "temperatureSa":"1.0", "weatherForecast":"200", "windDirection":"15.9", "windSpeed":"2.1"},
         "202409041400":
          {"humidity":"70.2", "temperature":"33.3", "temperatureSa":"1.5", "weatherForecast":"200", "windDirection":"17.2", "windSpeed":"2.0"},
         "202409041500":
          {"humidity":"67.0", "temperature":"33.3", "temperatureSa":"1.3", "weatherForecast":"200", "windDirection":"23.6", "windSpeed":"1.9"},
         "202409041600":
          {"humidity":"66.9", "temperature":"33.3", "temperatureSa":"1.4", "weatherForecast":"200", "windDirection":"30.5", "windSpeed":"2.0"},
         "202409041700":
          {"humidity":"68.0", "temperature":"33.3", "temperatureSa":"1.0", "weatherForecast":"100", "windDirection":"34.9", "windSpeed":"1.8"},
         "202409041800":
          {"humidity":"70.7", "temperature":"33.3", "temperatureSa":"0.0", "weatherForecast":"100", "windDirection":"31.9", "windSpeed":"1.6"},
         "202409041900":
          {"humidity":"74.3", "temperature":"33.3", "temperatureSa":"0.2", "weatherForecast":"100", "windDirection":"15.9", "windSpeed":"1.4"},
         "202409042000":
          {"humidity":"77.2", "temperature":"33.3", "temperatureSa":"0.5", "weatherForecast":"100", "windDirection":"8.8", "windSpeed":"1.6"},
         "202409042100":
          {"humidity":"79.9", "temperature":"33.3", "temperatureSa":"0.6", "weatherForecast":"200", "windDirection":"4.6", "windSpeed":"1.5"},
         "202409042200":
          {"humidity":"81.8", "temperature":"33.3", "temperatureSa":"0.6", "weatherForecast":"200", "windDirection":"354.7", "windSpeed":"1.6"},
         "202409042300":
          {"humidity":"81.7", "temperature":"33.3", "temperatureSa":"0.3", "weatherForecast":"200", "windDirection":"349.9", "windSpeed":"1.6"},
         "202409050000":
          {"humidity":"82.5", "temperature":"33.3", "temperatureSa":"0.1", "weatherForecast":"200", "windDirection":"345.8", "windSpeed":"1.7"},
         "202409050100":
          {"humidity":"83.4", "temperature":"33.3", "weatherForecast":"200", "windDirection":"345.9", "windSpeed":"1.6"},
         "202409050200":
          {"humidity":"84.4", "temperature":"33.3", "weatherForecast":"200", "windDirection":"344.6", "windSpeed":"1.8"},
         "202409050300":
          {"humidity":"85.5", "temperature":"33.3", "weatherForecast":"200", "windDirection":"341.8", "windSpeed":"1.9"},
         "202409050400":
          {"humidity":"86.2", "temperature":"33.3", "weatherForecast":"200", "windDirection":"342.8", "windSpeed":"1.9"},
         "202409050500":
          {"humidity":"85.0", "temperature":"33.3", "weatherForecast":"200", "windDirection":"345.2", "windSpeed":"1.8"},
         "202409050600":
          {"humidity":"84.0", "temperature":"33.3", "weatherForecast":"200", "windDirection":"347.0", "windSpeed":"1.6"},
         "202409050700":
          {"humidity":"82.3", "temperature":"33.3", "weatherForecast":"200", "windDirection":"346.8", "windSpeed":"1.6"},
         "202409050800":
          {"humidity":"80.3", "temperature":"33.3", "weatherForecast":"200", "windDirection":"350.9", "windSpeed":"1.7"},
         "202409050900":
          {"humidity":"78.8", "temperature":"33.3", "weatherForecast":"200", "windDirection":"353.1", "windSpeed":"1.5"},
         "202409051000":
          {"humidity":"76.7", "temperature":"33.3", "weatherForecast":"200", "windDirection":"354.4", "windSpeed":"1.5"},
         "202409051100":
          {"humidity":"74.3", "temperature":"33.3", "weatherForecast":"200", "windDirection":"350.8", "windSpeed":"1.7"},
         "202409051200":
          {"humidity":"71.9", "temperature":"33.3", "weatherForecast":"200", "windDirection":"358.1", "windSpeed":"1.5"},
         "202409051300":
          {"humidity":"70.2", "temperature":"33.3", "weatherForecast":"100", "windDirection":"16.6", "windSpeed":"0.8"},
         "202409051400":
          {"humidity":"65.9", "temperature":"33.3", "weatherForecast":"100", "windDirection":"107.1", "windSpeed":"1.2"},
         "202409051500":
          {"humidity":"64.9", "temperature":"33.3", "weatherForecast":"100", "windDirection":"133.5", "windSpeed":"2.2"},
         "202409051600":
          {"humidity":"67.9", "temperature":"33.3", "weatherForecast":"100", "windDirection":"148.2", "windSpeed":"2.9"},
         "202409051700":
          {"humidity":"70.2", "temperature":"33.3", "weatherForecast":"200", "windDirection":"159.2", "windSpeed":"3.3"},
         "202409051800":
          {"humidity":"72.6", "temperature":"33.3", "weatherForecast":"100", "windDirection":"168.5", "windSpeed":"3.5"},
         "202409051900":
          {"humidity":"75.1", "temperature":"33.3", "weatherForecast":"100", "windDirection":"176.2", "windSpeed":"3.6"},
         "202409052000":
          {"humidity":"78.7", "temperature":"33.3", "weatherForecast":"100", "windDirection":"181.7", "windSpeed":"3.5"},
         "202409052100":
          {"humidity":"81.9", "temperature":"33.3", "weatherForecast":"100", "windDirection":"183.2", "windSpeed":"3.3"},
         "202409052200":
          {"humidity":"84.6", "temperature":"33.3", "weatherForecast":"100", "windDirection":"182.1", "windSpeed":"3.0"},
         "202409052300":
          {"humidity":"87.4", "temperature":"33.3", "weatherForecast":"100", "windDirection":"180.2", "windSpeed":"2.8"},
         "202409060000":
          {"humidity":"90.0", "temperature":"33.3", "weatherForecast":"100", "windDirection":"180.3", "windSpeed":"2.5"},
         "202409060100":
          {"humidity":"92.1", "temperature":"33.3", "weatherForecast":"100", "windDirection":"184.4", "windSpeed":"2.2"},
         "202409060200":
          {"humidity":"94.4", "temperature":"33.3", "weatherForecast":"100", "windDirection":"189.4", "windSpeed":"1.7"},
         "202409060300":
          {"humidity":"96.4", "temperature":"33.3", "weatherForecast":"200", "windDirection":"194.0", "windSpeed":"1.2"},
         "202409060400":
          {"humidity":"97.9", "temperature":"33.3", "weatherForecast":"200", "windDirection":"208.2", "windSpeed":"0.8"},
         "202409060500":
          {"humidity":"99.3", "temperature":"33.3", "weatherForecast":"200", "windDirection":"243.7", "windSpeed":"0.4"},
         "202409060600":
          {"humidity":"99.7", "temperature":"33.3", "weatherForecast":"200", "windDirection":"273.5", "windSpeed":"0.3"},
         "202409060700":
          {"humidity":"95.4", "temperature":"33.3", "weatherForecast":"100", "windDirection":"290.5", "windSpeed":"0.5"},
         "202409060800":
          {"humidity":"88.3", "temperature":"33.3", "weatherForecast":"100", "windDirection":"300.5", "windSpeed":"0.5"},
         "202409060900":
          {"humidity":"81.4", "temperature":"33.3", "weatherForecast":"200", "windDirection":"291.8", "windSpeed":"0.4"},
         "202409061000":
          {"humidity":"76.2", "temperature":"33.3", "weatherForecast":"200", "windDirection":"286.3", "windSpeed":"0.2"},
         "202409061100":
          {"humidity":"70.5", "temperature":"33.3", "weatherForecast":"100", "windDirection":"153.7", "windSpeed":"0.6"},
         "202409061200":
          {"humidity":"65.2", "temperature":"33.3", "weatherForecast":"100", "windDirection":"154.5", "windSpeed":"1.5"},
         "202409061300":
          {"humidity":"60.5", "temperature":"33.3", "weatherForecast":"100", "windDirection":"159.6", "windSpeed":"1.9"},
         "202409061400":
          {"humidity":"57.6", "temperature":"33.3", "weatherForecast":"100", "windDirection":"166.4", "windSpeed":"2.4"},
         "202409061500":
          {"humidity":"56.9", "temperature":"33.3", "weatherForecast":"100", "windDirection":"170.9", "windSpeed":"3.2"},
         "202409061600":
          {"humidity":"59.8", "temperature":"33.3", "weatherForecast":"100", "windDirection":"176.3", "windSpeed":"3.8"},
         "202409061700":
          {"humidity":"62.8", "temperature":"33.3", "weatherForecast":"100", "windDirection":"181.5", "windSpeed":"4.1"},
         "202409061800":
          {"humidity":"65.4", "temperature":"33.3", "weatherForecast":"100", "windDirection":"181.9", "windSpeed":"3.9"},
         "202409061900":
          {"humidity":"69.2", "temperature":"33.3", "weatherForecast":"100", "windDirection":"175.3", "windSpeed":"3.4"},
         "202409062000":
          {"humidity":"74.8", "temperature":"33.3", "weatherForecast":"100", "windDirection":"165.9", "windSpeed":"3.0"},
         "202409062100":
          {"humidity":"80.0", "temperature":"33.3", "weatherForecast":"100", "windDirection":"159.6", "windSpeed":"2.5"},
         "202409062200":
          {"humidity":"83.9", "temperature":"33.3", "weatherForecast":"100", "windDirection":"155.1", "windSpeed":"2.0"},
         "202409062300":
          {"humidity":"86.8", "temperature":"33.3", "weatherForecast":"100", "windDirection":"152.1", "windSpeed":"1.6"},
         "202409070000":
          {"humidity":"89.7", "temperature":"33.3", "weatherForecast":"100", "windDirection":"151.8", "windSpeed":"1.2"}
        },
       "ForecastPrecipitaiton":[
          {"dtf":"202409040000-202409040100", "east":142.0, "fileName":"precipitation/shortme/202409040000-00060/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409040100-202409040200", "east":142.0, "fileName":"precipitation/shortme/202409040000-00120/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.5", "west":136.0},
          {"dtf":"202409040200-202409040300", "east":142.0, "fileName":"precipitation/shortme/202409040000-00180/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.5", "west":136.0},
          {"dtf":"202409040300-202409040400", "east":142.0, "fileName":"precipitation/shortme/202409040000-00240/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.5", "west":136.0},
          {"dtf":"202409040400-202409040500", "east":142.0, "fileName":"precipitation/shortme/202409040000-00300/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.5", "west":136.0},
          {"dtf":"202409040500-202409040600", "east":142.0, "fileName":"precipitation/shortme/202409040000-00360/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409040600-202409040700", "east":142.0, "fileName":"precipitation/msm15/202409032100-00600/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409040700-202409040800", "east":142.0, "fileName":"precipitation/msm15/202409032100-00660/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409040800-202409040900", "east":142.0, "fileName":"precipitation/msm15/202409032100-00720/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409040900-202409041000", "east":142.0, "fileName":"precipitation/msm15/202409032100-00780/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409041000-202409041100", "east":142.0, "fileName":"precipitation/msm15/202409032100-00840/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409041100-202409041200", "east":142.0, "fileName":"precipitation/msm15/202409032100-00900/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409041200-202409041300", "east":142.0, "fileName":"precipitation/msm33/202409032100-00960/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409041300-202409041400", "east":142.0, "fileName":"precipitation/msm33/202409032100-01020/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409041400-202409041500", "east":142.0, "fileName":"precipitation/msm33/202409032100-01080/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409041500-202409041600", "east":142.0, "fileName":"precipitation/msm33/202409032100-01140/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409041600-202409041700", "east":142.0, "fileName":"precipitation/msm33/202409032100-01200/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409041700-202409041800", "east":142.0, "fileName":"precipitation/msm33/202409032100-01260/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409041800-202409041900", "east":142.0, "fileName":"precipitation/msm33/202409032100-01320/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409041900-202409042000", "east":142.0, "fileName":"precipitation/msm33/202409032100-01380/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409042000-202409042100", "east":142.0, "fileName":"precipitation/msm33/202409032100-01440/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409042100-202409042200", "east":142.0, "fileName":"precipitation/msm33/202409032100-01500/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409042200-202409042300", "east":142.0, "fileName":"precipitation/msm33/202409032100-01560/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409042300-202409050000", "east":142.0, "fileName":"precipitation/msm33/202409032100-01620/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409050000-202409050100", "east":142.0, "fileName":"precipitation/msm33/202409032100-01680/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409050100-202409050200", "east":142.0, "fileName":"precipitation/msm33/202409032100-01740/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409050200-202409050300", "east":142.0, "fileName":"precipitation/msm33/202409032100-01800/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409050300-202409050400", "east":142.0, "fileName":"precipitation/msm33/202409032100-01860/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409050400-202409050500", "east":142.0, "fileName":"precipitation/msm33/202409032100-01920/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409050500-202409050600", "east":142.0, "fileName":"precipitation/msm33/202409032100-01980/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409050600-202409050700", "east":142.0, "fileName":"precipitation/msm39/202409032100-02040/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409050700-202409050800", "east":142.0, "fileName":"precipitation/msm39/202409032100-02100/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409050800-202409050900", "east":142.0, "fileName":"precipitation/msm39/202409032100-02160/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409050900-202409051000", "east":142.0, "fileName":"precipitation/msm39/202409032100-02220/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409051000-202409051100", "east":142.0, "fileName":"precipitation/msm39/202409032100-02280/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409051100-202409051200", "east":142.0, "fileName":"precipitation/msm39/202409032100-02340/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409051200-202409051300", "east":142.0, "fileName":"precipitation/gsm84/202409031500-02760/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409051300-202409051400", "east":142.0, "fileName":"precipitation/gsm84/202409031500-02820/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409051400-202409051500", "east":142.0, "fileName":"precipitation/gsm84/202409031500-02880/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409051500-202409051600", "east":142.0, "fileName":"precipitation/gsm84/202409031500-02940/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409051600-202409051700", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03000/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409051700-202409051800", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03060/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409051800-202409051900", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03120/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409051900-202409052000", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03180/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409052000-202409052100", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03240/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409052100-202409052200", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03300/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409052200-202409052300", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03360/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409052300-202409060000", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03420/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409060000-202409060100", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03480/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409060100-202409060200", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03540/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409060200-202409060300", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03600/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409060300-202409060400", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03660/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409060400-202409060500", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03720/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409060500-202409060600", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03780/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409060600-202409060700", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03840/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409060700-202409060800", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03900/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409060800-202409060900", "east":142.0, "fileName":"precipitation/gsm84/202409031500-03960/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409060900-202409061000", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04020/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409061000-202409061100", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04080/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409061100-202409061200", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04140/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409061200-202409061300", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04200/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409061300-202409061400", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04260/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409061400-202409061500", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04320/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409061500-202409061600", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04380/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409061600-202409061700", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04440/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409061700-202409061800", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04500/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409061800-202409061900", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04560/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409061900-202409062000", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04620/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409062000-202409062100", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04680/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409062100-202409062200", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04740/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409062200-202409062300", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04800/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0},
          {"dtf":"202409062300-202409070000", "east":142.0, "fileName":"precipitation/gsm84/202409031500-04860/0/0120-0080/480-480/240-000/0003-0003.png", "north":38.0, "south":34.0, "value":"0.0", "west":136.0}
        ],
       "lx":0, "ly":0, "param":
        {"key":"***", "lat":"35.73243", "lon":"139.71547", "rem":"all", "sid":"wimage72-service"},
       "sessionId":"34896F19E4429C54987027BABC14CAFA", "sid":"wimage72-service", "systemTime":"2024/09/04 01:00:04.785 JST"}
      """;

  @Test
  void applyMasking() throws IOException {
    // 準備
    ObjectMapper objectMapper = new ObjectMapper();
    // マスク処理が有効であること
    assertTrue(dreamApiConfig.wimage72().response().save().masking().enabled());
    // ActualInfosのtemperature
    // ActualPrecipitationのvalue
    // ForecastInfosのtemperature
    // をマスクするクエリであること
    assertEquals(query, dreamApiConfig.wimage72().response().save().masking().query());
    // マスク対象のレスポンスファイルが存在すること
    List<File> fileList = task.getResponseFileList("masking");
    assertFalse(fileList.isEmpty());

    // 実行
    task.applyMask("masking");

    // 検証
    for (File file : fileList) {
      // マスク処理がされていること
      JsonNode expected = objectMapper.readTree(masked);
      JsonNode actual = objectMapper.readTree(file);
      assertEquals(expected, actual);
    }
  }

  @Test
  void applyMasking_NG() {
    // 準備
    String targetDateTime = "masking_ng_create_backup_dir";
    // マスク処理が有効であること
    assertTrue(dreamApiConfig.wimage72().response().save().masking().enabled());
    // バックアップディレクトリと同名のファイルが存在すること
    File file =
        Paths.get(dreamApiConfig.wimage72().response().save().directory(), targetDateTime, "backup")
            .toFile();
    assertTrue(file.exists());

    // 実行と検証
    // バックアップディレクトリの生成失敗した場合はRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          task.applyMask(targetDateTime);
        });
  }

  @Test
  void execute() throws InterruptedException {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();

      // 5秒後の日時を計算して、それまで待機することで対象日時をコントロールする
      ZonedDateTime now = ZonedDateTime.now(dreamApiConfig.wimage72().timeZoneToZoneId());
      ZonedDateTime target = now.plusSeconds(5).minusNanos(now.getNano());
      Duration wait = Duration.between(now, target);
      String expectedFormattedTargetDate = dreamApiClient.formatTargetDateTime(target);
      logger.info("target={} now={} wait={}", target, now, wait.toMillis());

      // DreamApi OK
      // プロパティに記載された回数分呼ばれるが返すデータはすべて同じ
      mockServerClient
          .when(MockServerTestHelper.getWimage72Request(dreamApiConfig))
          .respond(
              MockServerTestHelper.getWimage72ResponseOk(
                  MockServerTestHelper.RESPONSE_OK_TARGET_DATE_TIME, expectedFormattedTargetDate));
      // VdlAuth OK
      mockServerClient
          .when(MockServerTestHelper.getVdlAuthRequest(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlAuthResponseOk());
      // VdlData OK
      mockServerClient
          .when(MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlDataResponsePostCreated201());

      // gradlewで実行した場合に5秒経過する前に実行されることがあるため1ms多めにスリープする
      Thread.sleep(wait.toMillis() + 1);

      // 実行
      task.execute();

      // 検証
      // DreamApiが設定ファイルの座標の件数分呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getWimage72Request(dreamApiConfig),
          VerificationTimes.exactly(dreamApiConfig.wimage72().request().coordinates().size()));

      // Axispotへの格納件数は実行された日時によって変動するため1件以上であることを確認する
      assertFalse(axispotTestHelper.getAll().isEmpty());

      // VdlAuthが設定ファイルの座標の件数分呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVdlAuthRequest(vdlApiConfig),
          VerificationTimes.exactly(dreamApiConfig.wimage72().request().coordinates().size()));
      // VdlDataが設定ファイルの座標の件数分呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig),
          VerificationTimes.exactly(dreamApiConfig.wimage72().request().coordinates().size()));
      // レスポンス保存ディレクトリが削除されていること
      assertFalse(
          Paths.get(
                  dreamApiConfig.wimage72().response().save().directory(),
                  expectedFormattedTargetDate)
              .toFile()
              .exists());
    }
  }
}

@MockServerTest({
  MockServerTestHelper.CustomProperties.HALEX_DREAM_API_WIMAGE72_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VDL_API_TOKEN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VDL_API_DATA_REQUEST_ENDPOINT
})
@SpringBootTest
@Import(ContainerConfig.class)
@ActiveProfiles({"ut", "masking-fail-safe"})
class MaskingFailSafeTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;
  @Autowired private WeatherInformationCollectingTask task;
  @Autowired private DreamApiClient dreamApiClient;
  @Autowired private DreamApiConfig dreamApiConfig;
  @Autowired private AxispotConfig axispotConfig;
  @Autowired private GenericContainer<?> weathersAxispotRedis;
  @Autowired private WeatherVdlApiConfig weatherVdlApiConfig;

  private VdlApiConfig vdlApiConfig;

  @PostConstruct
  void init() {
    vdlApiConfig = weatherVdlApiConfig.getApi();
  }

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) throws URISyntaxException {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(HALEX_DREAM_API_KEY, () -> "TEST");
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
    registry.add(AUTH_API_LOGIN_KEY, () -> "TEST");
    registry.add(AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID, () -> "TEST");
    registry.add(AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD, () -> "TEST");

    // 他プロパティを設定
    String saveDir =
        new File(
                WeatherInformationCollectingTaskTest.class
                    .getClassLoader()
                    .getResource("data/halex-dreamapi/wimage72-service")
                    .toURI())
            .toString();
    String geotempConfig =
        new File(
                WeatherInformationCollectingTaskTest.class
                    .getClassLoader()
                    .getResource("axispot/geotempConfig.properties")
                    .toURI())
            .toString();
    registry.add(HALEX_DREAM_API_WIMAGE72_RESPONSE_SAVE_DIRECTORY, () -> saveDir);
    registry.add(AXISPOT_GEOTEMP_CONFIG, () -> geotempConfig);
    logger.info(registry.toString());
  }

  @BeforeAll
  static void setup(
      @Autowired AxispotConfig axsipotConfig, @Autowired GenericContainer<?> weathersAxispotRedis) {
    String config = axsipotConfig.geotemp().config();
    try (FileInputStream input = new FileInputStream(config)) {
      Properties properties = new Properties();
      properties.load(input);
      // コンテナのホスト名とRedisのポート6379とバインドしたポートを取得する
      String storeNodeInfo =
          weathersAxispotRedis.getHost() + ":" + weathersAxispotRedis.getMappedPort(6379);
      // geotempConifg.propertiesを上書き
      properties.setProperty("storeNodeInfo", storeNodeInfo);
      try (FileOutputStream output = new FileOutputStream(config)) {
        properties.store(output, "Test Container properties");
      }
    } catch (FileNotFoundException e) {
      throw new RuntimeException(e);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  // マスク処理のクエリ（application-masking-enabled-true.yamlと合わせること）
  // 不正なクエリとすること
  // ※以下はinvalid_test()がエラーとなる
  String invalidQuery =
      """
      .ActualInfos |= invalid_test(.value.temperature = "11.1") |
      .ActualPrecipitation[] |= (.value="22.2") |
      .ForecastInfos |= with_entries(.value.temperature = "33.3")
      """;

  @Test
  void applyMasking_fail_safe() {
    // 準備
    String targetDateTime = "masking_fail_safe";
    // マスク処理が有効であること
    assertTrue(dreamApiConfig.wimage72().response().save().masking().enabled());
    // 不正なクエリであること
    assertEquals(invalidQuery, dreamApiConfig.wimage72().response().save().masking().query());
    // 実行と検証
    // jqクエリの実行に失敗した場合はRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          task.applyMask(targetDateTime);
        });
  }

  @Test
  void execute() throws InterruptedException {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();

      // 5秒後の日時を計算して、それまで待機することで対象日時をコントロールする
      ZonedDateTime now = ZonedDateTime.now(dreamApiConfig.wimage72().timeZoneToZoneId());
      ZonedDateTime target = now.plusSeconds(5).minusNanos(now.getNano());
      Duration wait = Duration.between(now, target);
      String expectedFormattedTargetDate = dreamApiClient.formatTargetDateTime(target);
      logger.info("target={} now={} wait={}", target, now, wait.toMillis());

      // DreamApi OK
      // プロパティに記載された回数分呼ばれるが返すデータはすべて同じ
      mockServerClient
          .when(MockServerTestHelper.getWimage72Request(dreamApiConfig))
          .respond(
              MockServerTestHelper.getWimage72ResponseOk(
                  MockServerTestHelper.RESPONSE_OK_TARGET_DATE_TIME, expectedFormattedTargetDate));
      // VdlAuth OK
      mockServerClient
          .when(MockServerTestHelper.getVdlAuthRequest(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlAuthResponseOk());
      // VdlData OK
      mockServerClient
          .when(MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlDataResponsePostCreated201());

      // gradlewで実行した場合に5秒経過する前に実行されることがあるため1ms多めにスリープする
      Thread.sleep(wait.toMillis() + 1);

      // 実行
      task.execute();

      // 検証
      // DreamApiが設定ファイルの座標の件数分呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getWimage72Request(dreamApiConfig),
          VerificationTimes.exactly(dreamApiConfig.wimage72().request().coordinates().size()));

      // マスキング処理で失敗するためAxispotへの格納件数は0件であること
      assertTrue(axispotTestHelper.getAll().isEmpty());

      // マスキング処理で失敗するためVdlAuthが呼ばれないこと
      mockServerClient.verify(
          MockServerTestHelper.getVdlAuthRequest(vdlApiConfig), VerificationTimes.exactly(0));
      // マスキング処理で失敗するためVdlDataが呼ばれないこと
      mockServerClient.verify(
          MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig),
          VerificationTimes.exactly(0));
      // マスキング処理で失敗するためレスポンス保存ディレクトリが存在すること
      assertTrue(
          Paths.get(
                  dreamApiConfig.wimage72().response().save().directory(),
                  expectedFormattedTargetDate)
              .toFile()
              .exists());
    }
  }
}
