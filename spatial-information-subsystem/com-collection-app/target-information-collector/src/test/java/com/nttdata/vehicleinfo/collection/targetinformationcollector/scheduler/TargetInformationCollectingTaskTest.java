package com.nttdata.vehicleinfo.collection.targetinformationcollector.scheduler;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.nttdata.vdl.api.client.VdlApiConfig;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.config.AuthApiConfig;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.config.AxispotConfig;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.config.TargetInfoApiConfig;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.config.TargetVdlApiConfig;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.service.TargetInfoApiClient;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.test.AxispotTestHelper;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.test.ContainerConfig;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.test.DynamicPropertySourceTestHelper;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.test.MockServerTestHelper;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.test.TargetInfoResponseParserTestHelper;
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
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
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
  MockServerTestHelper.CustomProperties.TARGET_AUTH_API_LOGIN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.TARGET_TIER_4_TARGET_INFO_API_TARGET_INFO_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.TARGET_VDL_API_TOKEN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.TARGET_VDL_API_DATA_REQUEST_ENDPOINT
})
@SpringBootTest
@Import(ContainerConfig.class)
class TargetInformationCollectingTaskTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;
  @Autowired private TargetInformationCollectingTask task;
  @Autowired private TargetInfoApiClient targetInfoApiClient;
  @Autowired private TargetInfoApiConfig targetInfoApiConfig;
  @Autowired private AxispotConfig axispotConfig;
  @Autowired private GenericContainer<?> targetInfoAxispotRedis;
  @Autowired private AuthApiConfig authApiConfig;
  @Autowired private TargetVdlApiConfig targetVdlApiConfig;

  private VdlApiConfig vdlApiConfig;

  @PostConstruct
  void init() {
    this.vdlApiConfig = targetVdlApiConfig.getApi();
  }

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

    // レスポンスファイルの保存ディレクトリのパスをリソースから取得してプロパティに設定
    String saveDir =
        new File(
                MethodHandles.lookup()
                    .lookupClass()
                    .getClassLoader()
                    .getResource("data/tier4-targetinfoapi/targetinfo")
                    .toURI())
            .toString();
    registry.add("target.tier4.target-info-api.target-info.response.save.directory", () -> saveDir);

    // Axispotの設定ファイルのパスをリソースから取得してプロパティに設定
    String geotempConfig =
        new File(
                MethodHandles.lookup()
                    .lookupClass()
                    .getClassLoader()
                    .getResource("axispot/geotempConfig.properties")
                    .toURI())
            .toString();
    registry.add("target.axispot.geotemp.config", () -> geotempConfig);

    logger.info(registry.toString());
  }

  @BeforeAll
  static void setup(
      @Autowired AxispotConfig axispotConfig,
      @Autowired GenericContainer<?> targetInfoAxispotRedis) {
    String config = axispotConfig.geotemp().config();
    try (FileInputStream input = new FileInputStream(config)) {
      Properties properties = new Properties();
      properties.load(input);
      // コンテナのホスト名とRedisのポート6379とバインドしたポートを取得する
      String storeNodeInfo =
          targetInfoAxispotRedis.getHost() + ":" + targetInfoAxispotRedis.getMappedPort(6379);
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

      // AuthApi OK
      // debug-auth-skip=false
      assertFalse(targetInfoApiConfig.debugAuthSkip());
      mockServerClient
          .when(MockServerTestHelper.getLoginRequest(authApiConfig))
          .respond(MockServerTestHelper.getLoginResponseOk());
      // TargetInfoApi OK
      // プロパティに記載された回数分呼ばれるが返すデータはすべて同じ(TargetInfoApiのExample）
      mockServerClient
          .when(MockServerTestHelper.getTargetInfoRequestAll(targetInfoApiConfig))
          .respond(MockServerTestHelper.getTargetInfoResponseExample());
      // VdlAuth OK
      mockServerClient
          .when(MockServerTestHelper.getVdlAuthRequest(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlAuthResponseOk());
      // VdlData OK
      mockServerClient
          .when(MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlDataResponsePostCreated201());

      // 5秒後の日時を計算して、それまで待機することで対象日時をコントロールする
      ZonedDateTime now = ZonedDateTime.now(targetInfoApiConfig.targetInfo().timeZoneToZoneId());
      ZonedDateTime target = now.plusSeconds(5).minusNanos(now.getNano());
      Duration wait = Duration.between(now, target);
      logger.info("target={} now={} wait={}", target, now, wait.toMillis());
      // gradlewで実行した場合に5秒経過する前に実行されることがあるため1ms多めにスリープする
      Thread.sleep(wait.toMillis() + 1);

      String expectedFormattedTargetDate = targetInfoApiClient.formatTargetDateTime(target);

      // 実行
      task.execute();

      // 検証
      // AuthApiが3回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(3));
      // TargetInfoApiが3回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getTargetInfoRequestAll(targetInfoApiConfig),
          VerificationTimes.exactly(3));
      // Axispotにレスポンスのデータ（6件）が格納されていること
      // ファイルは3件作成されるが中身が同じ（TargetInfoApiのExample）のため、
      // Axispot（Redis）には同じデータとして扱われて6件のみとなる
      assertEquals(6, axispotTestHelper.getAll().size());
      // VdlAuthが3回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVdlAuthRequest(vdlApiConfig), VerificationTimes.exactly(3));
      // VdlDataが3回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig),
          VerificationTimes.exactly(3));
      // レスポンスファイルが削除されていること
      // 設定ファイル「target.tier4.target-info-api.target-info.request.parameters」を参照
      assertFalse(
          targetInfoApiClient
              .getSaveFilePath(expectedFormattedTargetDate, "16777215", "12345678")
              .toFile()
              .exists());
      assertFalse(
          targetInfoApiClient
              .getSaveFilePath(expectedFormattedTargetDate, "0", "22222222")
              .toFile()
              .exists());
      assertFalse(
          targetInfoApiClient
              .getSaveFilePath(expectedFormattedTargetDate, "1", "33333333")
              .toFile()
              .exists());
    }
  }

  @Test
  void execute_AuthNg() {
    // AuthApiのユーザー認証に失敗した場合は後続処理をスキップして正常終了する
    // ・プロパティのパラメータの回数分AuthApiに失敗する
    int expectedCount = targetInfoApiConfig.targetInfo().request().parameters().size();

    // 準備
    // AuthApi NG
    // debug-auth-skip=false
    assertFalse(targetInfoApiConfig.debugAuthSkip());
    mockServerClient
        .when(MockServerTestHelper.getLoginRequest(authApiConfig))
        .respond(MockServerTestHelper.getLoginResponseNg());
    // TargetInfoApi OK
    mockServerClient
        .when(MockServerTestHelper.getTargetInfoRequest12345678(targetInfoApiConfig))
        .respond(MockServerTestHelper.getTargetInfoResponseExample());

    // 実行
    task.execute();

    // 検証
    // AuthApiがプロパティのパラメータの回数分呼ばれていること
    mockServerClient.verify(
        MockServerTestHelper.getLoginRequest(authApiConfig),
        VerificationTimes.exactly(expectedCount));
    // TargetInfoApiは呼ばれないこと
    mockServerClient.verify(
        MockServerTestHelper.getTargetInfoRequest12345678(targetInfoApiConfig),
        VerificationTimes.exactly(0));
  }

  @Test
  void saveToAxispot_OK_Example() {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();
      // テスト用ファイルが存在すること
      assertDoesNotThrow(() -> TargetInfoResponseParserTestHelper.getExample());

      // 実行
      task.saveToAxispot(TargetInfoResponseParserTestHelper.EXAMPLE_TARGET_DATE_TIME);

      // 検証

      // Redisの検索でデータの件数が正しいかを確認する
      // 6件取得できること
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(6, result.size());

      // 時空間データ検索でHITすることを確認する
      // Axispot検索条件
      //            "time": "2024-01-23T01:23:45.678+09:00",
      //            "latitude": 123456789,
      //            "longitude": 1234567891,
      //            "elevation": 123,
      String targetIndividualInfoTime = "2024-01-23T01:23:45.678+09:00";
      ZonedDateTime updatedAtZonedDateTime =
          ZonedDateTime.parse(targetIndividualInfoTime, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
      long time = updatedAtZonedDateTime.toEpochSecond();
      double lat = 123456789 / 10000000.0; // 分解能: 0.0000001度
      double lon = 1234567891 / 10000000.0; // 分解能: 0.0000001度
      double alt = 123 / 10.0; // 分解能: 0.1m
      int searchPrecision = 52;
      // 1件取得できること
      int count = axispotTestHelper.count(time, lon, lat, alt, searchPrecision);
      assertEquals(1, count);
    } catch (Exception e) {
      Assertions.fail(e);
    }
  }

  @Test
  void saveToAxispot_OK_20240124000000() {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();
      // テスト用ファイルが存在すること
      assertDoesNotThrow(() -> TargetInfoResponseParserTestHelper.get20240124000000());

      // 実行
      task.saveToAxispot(TargetInfoResponseParserTestHelper.TEST_TARGET_DATE_TIME);

      // 検証

      // Redisの検索でデータの件数が正しいかを確認する
      // 2件取得できること
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(2, result.size());

      // 時空間データ検索でHITすることを確認する
      // Axispot検索条件
      //        "time": "2024-01-24T00:00:00.00+09:00",
      //        "latitude": 11,
      //        "longitude": 12,
      //        "elevation": 13,
      String targetIndividualInfoTime = "2024-01-24T01:00:00.00+09:00";
      ZonedDateTime updatedAtZonedDateTime =
          ZonedDateTime.parse(targetIndividualInfoTime, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
      long time = updatedAtZonedDateTime.toEpochSecond();
      double lat = 11 / 10000000.0; // 分解能: 0.0000001度
      double lon = 12 / 10000000.0; // 分解能: 0.0000001度
      double alt = 13 / 10.0; // 分解能: 0.1m
      int searchPrecision = 52;
      // 1件取得できること
      int count = axispotTestHelper.count(time, lon, lat, alt, searchPrecision);
      assertEquals(1, count);
    } catch (Exception e) {
      Assertions.fail(e);
    }
  }

  @Test
  void saveToAxispot_OK_zero() {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();
      // テスト用ファイルが存在すること
      assertDoesNotThrow(() -> TargetInfoResponseParserTestHelper.getZero());

      // 実行
      task.saveToAxispot(TargetInfoResponseParserTestHelper.ZERO_TARGET_DATE_TIME);

      // Redisの検索でデータの件数が正しいかを確認する
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(0, result.size());
    } catch (Exception e) {
      Assertions.fail(e);
    }
  }

  @Test
  void saveToAxispot_OK_required() {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();
      // テスト用ファイルが存在すること
      assertDoesNotThrow(() -> TargetInfoResponseParserTestHelper.getRequired());

      // 実行
      task.saveToAxispot(TargetInfoResponseParserTestHelper.REQUIRED_TARGET_DATE_TIME);

      // Redisの検索でデータの件数が正しいかを確認する
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(1, result.size());

      Map<String, String> attributes = result.stream().findFirst().get().getAttributes();
      // 必須のみであれば33項目であること
      assertEquals(33, attributes.size());

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
      assertDoesNotThrow(() -> TargetInfoResponseParserTestHelper.getIllegalLocationSpatialId());

      // 実行
      task.saveToAxispot(
          TargetInfoResponseParserTestHelper.ILLEGAL_LOCATION_SPATIAL_ID_TARGET_DATE_TIME);

      // Redisの検索でデータの件数が正しいかを確認する
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(0, result.size());

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
      assertDoesNotThrow(() -> TargetInfoResponseParserTestHelper.getIllegalLocationAxispot());

      // 実行
      task.saveToAxispot(
          TargetInfoResponseParserTestHelper.ILLEGAL_LOCATION_AXISPOT_TARGET_DATE_TIME);

      // Redisの検索でデータの件数が正しいかを確認する
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(0, result.size());

    } catch (Exception e) {
      Assertions.fail(e);
    }
  }

  @Test
  void saveToAxispot_NG_timeout() {
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
    Path dir =
        Paths.get(targetInfoApiConfig.targetInfo().response().save().directory(), targetDate);
    Files.createDirectory(dir);
    // 実行
    List<File> actual = task.getResponseFileList(targetDate);
    // 検証
    assertEquals(0, actual.size());
  }

  @Test
  void cleanUp() throws IOException {
    // 準備
    String targetDate = "TEST_202411010000";
    Path dir =
        Paths.get(targetInfoApiConfig.targetInfo().response().save().directory(), targetDate);
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
    // 準備
    String targetDate = TargetInfoResponseParserTestHelper.EXAMPLE_TARGET_DATE_TIME;
    String serviceLocationID = "16777215";
    String roadsideUnitId = "12345678";
    String fileName =
        "targetinfo_" + serviceLocationID + "_" + roadsideUnitId + "_" + targetDate + ".json";
    // プロパティには3件設定していること
    assertEquals(3, targetInfoApiConfig.targetInfo().request().parameters().size());
    // プロパティに対象パラメータが含まれていること
    assertTrue(
        targetInfoApiConfig
            .targetInfo()
            .request()
            .parameters()
            .contains(
                new TargetInfoApiConfig.TargetInfo.Request.Parameter(
                    serviceLocationID, roadsideUnitId)));
    // 対象日時のディレクトリに対象ファイルを配備していること
    File targetFile =
        TargetInfoResponseParserTestHelper.getResourceDataDirAsPath(targetDate, fileName).toFile();
    assertTrue(targetFile.exists());
    // 対象日時のディレクトリにdummy.txtも配備していること
    assertTrue(
        TargetInfoResponseParserTestHelper.getResourceDataDirAsPath(targetDate, "dummy.txt")
            .toFile()
            .exists());
    File targetDir = targetFile.getParentFile();
    // 対象ファイル1件、ダミー1件の2件であること
    assertEquals(2, targetDir.list().length);

    // 実行
    List<File> actual = task.getResponseFileList(targetDate);

    // 検証
    // ダミーファイルが含まれていないこと（1件）
    assertEquals(1, actual.size());
    // 対象ファイルと一致していること
    assertEquals(targetFile, actual.getFirst());
  }

  @Test
  void getResponseFileList_NG() {
    // 存在しないフォルダはRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          task.getResponseFileList("INVALID");
        });
    // 指定されたディレクトリがファイルはRuntimeExceptionが発生すること
    assertThrows(
        RuntimeException.class,
        () -> {
          task.getResponseFileList("20241119000000/dummy.txt");
        });
  }
}

@MockServerTest({
  MockServerTestHelper.CustomProperties.TARGET_AUTH_API_LOGIN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.TARGET_TIER_4_TARGET_INFO_API_TARGET_INFO_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.TARGET_VDL_API_TOKEN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.TARGET_VDL_API_DATA_REQUEST_ENDPOINT
})
@SpringBootTest
@Import(ContainerConfig.class)
@ActiveProfiles({"ut", "masking-enabled-true"})
class MaskingEnabledTrueTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;
  @Autowired private TargetInformationCollectingTask task;
  @Autowired private TargetInfoApiClient targetInfoApiClient;
  @Autowired private TargetInfoApiConfig targetInfoApiConfig;
  @Autowired private AxispotConfig axispotConfig;
  @Autowired private GenericContainer<?> targetInfoAxispotRedis;
  @Autowired private AuthApiConfig authApiConfig;
  @Autowired private TargetVdlApiConfig targetVdlApiConfig;

  private VdlApiConfig vdlApiConfig;

  @PostConstruct
  void init() {
    this.vdlApiConfig = targetVdlApiConfig.getApi();
  }

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

    // レスポンスファイルの保存ディレクトリのパスをリソースから取得してプロパティに設定
    String saveDir =
        new File(
                MethodHandles.lookup()
                    .lookupClass()
                    .getClassLoader()
                    .getResource("data/tier4-targetinfoapi/targetinfo")
                    .toURI())
            .toString();
    registry.add("target.tier4.target-info-api.target-info.response.save.directory", () -> saveDir);

    // Axispotの設定ファイルのパスをリソースから取得してプロパティに設定
    String geotempConfig =
        new File(
                MethodHandles.lookup()
                    .lookupClass()
                    .getClassLoader()
                    .getResource("axispot/geotempConfig.properties")
                    .toURI())
            .toString();
    registry.add("target.axispot.geotemp.config", () -> geotempConfig);

    logger.info(registry.toString());
  }

  @BeforeAll
  static void setup(
      @Autowired AxispotConfig axispotConfig,
      @Autowired GenericContainer<?> targetInfoAxispotRedis) {
    String config = axispotConfig.geotemp().config();
    try (FileInputStream input = new FileInputStream(config)) {
      Properties properties = new Properties();
      properties.load(input);
      // コンテナのホスト名とRedisのポート6379とバインドしたポートを取得する
      String storeNodeInfo =
          targetInfoAxispotRedis.getHost() + ":" + targetInfoAxispotRedis.getMappedPort(6379);
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
      .attribute.deviceIndividualInfo[] |= (
        .deviceID = 0 |
        .targetIndividualInfo[] |= (
          .targetID = 0
        )
      )
      """;

  // マスク処理後の期待値
  // deviceIDがマスクされること
  // targetIDがマスクされること
  String masked =
      """
      {
        "dataModelType": "dataModelType",
        "attribute": {
          "serviceLocationID": 16777215,
          "roadsideUnitID": 12345678,
          "formatVersion": 1,
          "updateTimeInfo": "2024-01-23T11:00:00.00Z",
          "deviceNum": 4,
          "deviceIndividualInfo": [
            {
              "deviceID": 0,
              "targetNum": 3,
              "targetIndividualInfo": [
                {
                  "commonServiceStandardID": 4,
                  "targetMessageID": 5,
                  "targetIndividualVersionInfo": 6,
                  "targetID": 0,
                  "targetIndividualIncrementCounter": 8,
                  "dataLength": 9,
                  "individualOptionFlag": 10,
                  "leapSecondCorrectionInfo": true,
                  "time": "2024-01-24T00:00:00.00+09:00",
                  "latitude": 11,
                  "longitude": 12,
                  "elevation": 13,
                  "positionConf": 14,
                  "elevationConf": 15,
                  "speed": 16,
                  "heading": 17,
                  "acceleration": 18,
                  "speedConf": 19,
                  "headingConf": 20,
                  "forwardRearAccelerationConf": 21,
                  "transmissionState": 22,
                  "steeringWheelAngle": 23,
                  "sizeClassification": 24,
                  "roleClassification": 25,
                  "vehicleWidth": 26,
                  "vehicleLength": 27,
                  "positionDelay": 28,
                  "revisionCounter": 29,
                  "roadFacilities": 30,
                  "roadClassification": 31,
                  "semiMajorAxisOfPositionalErrorEllipse": 32,
                  "semiMinorAxisOfPositionalErrorEllipse": 33,
                  "semiMajorAxisOrientationOfPositionalErrorEllipse": 34,
                  "GPSPositioningMode": 35,
                  "GPSPDOP": 36,
                  "numberOfGPSSatellitesInUse": 37,
                  "GPSMultiPathDetection": 38,
                  "deadReckoningAvailability": false,
                  "mapMatchingAvailability": true,
                  "yawRate": 39,
                  "brakeAppliedStatus": 40,
                  "auxiliaryBrakeAppliedStatus": 41,
                  "throttlePosition": 42,
                  "exteriorLights": 43,
                  "adaptiveCruiseControlStatus": 44,
                  "cooperativeAdaptiveCruiseControlStatus": 45,
                  "preCrashSafetyStatus": 46,
                  "antilockBrakeStatus": 47,
                  "tractionControlStatus": 48,
                  "electronicStabilityControlStatus": 49,
                  "laneKeepingAssistStatus": 50,
                  "laneDepartureWarningStatus": 51,
                  "intersectionDistanceInformationAvailability": 52,
                  "intersectionDistance": 53,
                  "intersectionPositionInformationAvailability": 54,
                  "intersectionLatitude": 55,
                  "intersectionLongitude": 56,
                  "extendedInformation": 57,
                  "targetIndividualExtendedData": "targetIndividualExtendedData",
                  "restingState": 58,
                  "existingTime": 59
                },
                {
                  "commonServiceStandardID": 60,
                  "targetMessageID": 61,
                  "targetIndividualVersionInfo": 62,
                  "targetID": 0,
                  "targetIndividualIncrementCounter": 64,
                  "dataLength": 65,
                  "individualOptionFlag": 66,
                  "leapSecondCorrectionInfo": false,
                  "time": "2024-01-24T01:00:00.00+09:00",
                  "latitude": 67,
                  "longitude": 68,
                  "elevation": 69,
                  "positionConf": 70,
                  "elevationConf": 71,
                  "speed": 72,
                  "heading": 73,
                  "acceleration": 74,
                  "speedConf": 75,
                  "headingConf": 76,
                  "forwardRearAccelerationConf": 77,
                  "transmissionState": 78,
                  "steeringWheelAngle": 79,
                  "sizeClassification": 80,
                  "roleClassification": 81,
                  "vehicleWidth": 82,
                  "vehicleLength": 83,
                  "positionDelay": 84,
                  "revisionCounter": 85,
                  "roadFacilities": 86,
                  "roadClassification": 87,
                  "semiMajorAxisOfPositionalErrorEllipse": 88,
                  "semiMinorAxisOfPositionalErrorEllipse": 89,
                  "semiMajorAxisOrientationOfPositionalErrorEllipse": 90,
                  "GPSPositioningMode": 91,
                  "GPSPDOP": 92,
                  "numberOfGPSSatellitesInUse": 93,
                  "GPSMultiPathDetection": 94,
                  "deadReckoningAvailability": true,
                  "mapMatchingAvailability": false,
                  "yawRate": 95,
                  "brakeAppliedStatus": 96,
                  "auxiliaryBrakeAppliedStatus": 97,
                  "throttlePosition": 98,
                  "exteriorLights": 99,
                  "adaptiveCruiseControlStatus": 100,
                  "cooperativeAdaptiveCruiseControlStatus": 101,
                  "preCrashSafetyStatus": 102,
                  "antilockBrakeStatus": 103,
                  "tractionControlStatus": 104,
                  "electronicStabilityControlStatus": 105,
                  "laneKeepingAssistStatus": 106,
                  "laneDepartureWarningStatus": 107,
                  "intersectionDistanceInformationAvailability": 108,
                  "intersectionDistance": 109,
                  "intersectionPositionInformationAvailability": 110,
                  "intersectionLatitude": 111,
                  "intersectionLongitude": 112,
                  "extendedInformation": 113,
                  "targetIndividualExtendedData": "targetIndividualExtendedData2",
                  "restingState": 114,
                  "existingTime": 115
                }
              ]
            }
          ]
        }
      }
      """;

  @Test
  void applyMasking() throws IOException {
    // 準備
    ObjectMapper objectMapper = new ObjectMapper();
    // マスク処理が有効であること
    assertTrue(targetInfoApiConfig.targetInfo().response().save().masking().enabled());
    // deviceIDとtargetIDをマスクするクエリであること
    assertEquals(query, targetInfoApiConfig.targetInfo().response().save().masking().query());
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
  void execute() throws InterruptedException {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();

      // AuthApi OK
      // debug-auth-skip=false
      assertFalse(targetInfoApiConfig.debugAuthSkip());
      mockServerClient
          .when(MockServerTestHelper.getLoginRequest(authApiConfig))
          .respond(MockServerTestHelper.getLoginResponseOk());
      // TargetInfoApi OK
      // プロパティに記載された回数分呼ばれるが返すデータはすべて同じ(TargetInfoApiのExample）
      mockServerClient
          .when(MockServerTestHelper.getTargetInfoRequestAll(targetInfoApiConfig))
          .respond(MockServerTestHelper.getTargetInfoResponseExample());
      // VdlAuth OK
      mockServerClient
          .when(MockServerTestHelper.getVdlAuthRequest(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlAuthResponseOk());
      // VdlData OK
      mockServerClient
          .when(MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlDataResponsePostCreated201());

      // 5秒後の日時を計算して、それまで待機することで対象日時をコントロールする
      ZonedDateTime now = ZonedDateTime.now(targetInfoApiConfig.targetInfo().timeZoneToZoneId());
      ZonedDateTime target = now.plusSeconds(5).minusNanos(now.getNano());
      Duration wait = Duration.between(now, target);
      logger.info("target={} now={} wait={}", target, now, wait.toMillis());
      // gradlewで実行した場合に5秒経過する前に実行されることがあるため1ms多めにスリープする
      Thread.sleep(wait.toMillis() + 1);

      String expectedFormattedTargetDate = targetInfoApiClient.formatTargetDateTime(target);

      // 実行
      task.execute();

      // 検証
      // AuthApiが3回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(3));
      // TargetInfoApiが3回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getTargetInfoRequestAll(targetInfoApiConfig),
          VerificationTimes.exactly(3));
      // Axispotにレスポンスのデータ（6件）が格納されていること
      // ファイルは3件作成されるが中身が同じ（TargetInfoApiのExample）のため、
      // Axispot（Redis）には同じデータとして扱われて6件のみとなる
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(6, result.size());
      for (MovingObjectStoreData data : result) {
        assertEquals("0", data.getAttributes().get("deviceID"));
        assertEquals("0", data.getAttributes().get("targetID"));
      }

      // VdlAuthが3回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVdlAuthRequest(vdlApiConfig), VerificationTimes.exactly(3));
      // VdlDataが3回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig),
          VerificationTimes.exactly(3));
      // レスポンスファイルが削除されていること
      // 設定ファイル「target.tier4.target-info-api.target-info.request.parameters」を参照
      assertFalse(
          targetInfoApiClient
              .getSaveFilePath(expectedFormattedTargetDate, "16777215", "12345678")
              .toFile()
              .exists());
      assertFalse(
          targetInfoApiClient
              .getSaveFilePath(expectedFormattedTargetDate, "0", "22222222")
              .toFile()
              .exists());
      assertFalse(
          targetInfoApiClient
              .getSaveFilePath(expectedFormattedTargetDate, "1", "33333333")
              .toFile()
              .exists());
      // バックアップディレクトリが削除されていること
      File backupDir =
          Paths.get(
                  targetInfoApiConfig.targetInfo().response().save().directory(),
                  expectedFormattedTargetDate,
                  "backup")
              .toFile();
      assertFalse(backupDir.exists());
    }
  }
}

@MockServerTest({
  MockServerTestHelper.CustomProperties.TARGET_AUTH_API_LOGIN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.TARGET_TIER_4_TARGET_INFO_API_TARGET_INFO_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.TARGET_VDL_API_TOKEN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.TARGET_VDL_API_DATA_REQUEST_ENDPOINT
})
@SpringBootTest
@Import(ContainerConfig.class)
@ActiveProfiles({"ut", "masking-fail-safe"})
class MaskingFailSafeTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;
  @Autowired private TargetInformationCollectingTask task;
  @Autowired private TargetInfoApiClient targetInfoApiClient;
  @Autowired private TargetInfoApiConfig targetInfoApiConfig;
  @Autowired private AxispotConfig axispotConfig;
  @Autowired private GenericContainer<?> targetInfoAxispotRedis;
  @Autowired private AuthApiConfig authApiConfig;
  @Autowired private TargetVdlApiConfig targetVdlApiConfig;

  private VdlApiConfig vdlApiConfig;

  @PostConstruct
  void init() {
    this.vdlApiConfig = targetVdlApiConfig.getApi();
  }

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

    // レスポンスファイルの保存ディレクトリのパスをリソースから取得してプロパティに設定
    String saveDir =
        new File(
                MethodHandles.lookup()
                    .lookupClass()
                    .getClassLoader()
                    .getResource("data/tier4-targetinfoapi/targetinfo")
                    .toURI())
            .toString();
    registry.add("target.tier4.target-info-api.target-info.response.save.directory", () -> saveDir);

    // Axispotの設定ファイルのパスをリソースから取得してプロパティに設定
    String geotempConfig =
        new File(
                MethodHandles.lookup()
                    .lookupClass()
                    .getClassLoader()
                    .getResource("axispot/geotempConfig.properties")
                    .toURI())
            .toString();
    registry.add("target.axispot.geotemp.config", () -> geotempConfig);

    logger.info(registry.toString());
  }

  @BeforeAll
  static void setup(
      @Autowired AxispotConfig axispotConfig,
      @Autowired GenericContainer<?> targetInfoAxispotRedis) {
    String config = axispotConfig.geotemp().config();
    try (FileInputStream input = new FileInputStream(config)) {
      Properties properties = new Properties();
      properties.load(input);
      // コンテナのホスト名とRedisのポート6379とバインドしたポートを取得する
      String storeNodeInfo =
          targetInfoAxispotRedis.getHost() + ":" + targetInfoAxispotRedis.getMappedPort(6379);
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
      .attribute.deviceIndividualInfo[] |= (
        invalid_test(.deviceID = 0) |
        .targetIndividualInfo[] |= (
          .targetID = 0
        )
      )
      """;

  @Test
  void applyMasking_fail_safe() throws IOException {
    // 準備
    String targetDateTime = "masking_fail_safe";
    // マスク処理が有効であること
    assertTrue(targetInfoApiConfig.targetInfo().response().save().masking().enabled());
    // 不正なクエリであること
    assertEquals(
        invalidQuery, targetInfoApiConfig.targetInfo().response().save().masking().query());
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

      // AuthApi OK
      // debug-auth-skip=false
      assertFalse(targetInfoApiConfig.debugAuthSkip());
      mockServerClient
          .when(MockServerTestHelper.getLoginRequest(authApiConfig))
          .respond(MockServerTestHelper.getLoginResponseOk());
      // TargetInfoApi OK
      // プロパティに記載された回数分呼ばれるが返すデータはすべて同じ(TargetInfoApiのExample）
      mockServerClient
          .when(MockServerTestHelper.getTargetInfoRequestAll(targetInfoApiConfig))
          .respond(MockServerTestHelper.getTargetInfoResponseExample());
      // VdlAuth OK
      mockServerClient
          .when(MockServerTestHelper.getVdlAuthRequest(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlAuthResponseOk());
      // VdlData OK
      mockServerClient
          .when(MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlDataResponsePostCreated201());

      // 5秒後の日時を計算して、それまで待機することで対象日時をコントロールする
      ZonedDateTime now = ZonedDateTime.now(targetInfoApiConfig.targetInfo().timeZoneToZoneId());
      ZonedDateTime target = now.plusSeconds(5).withNano(0);
      Duration wait = Duration.between(now, target);
      logger.info("target={} now={} wait={}", target, now, wait.toMillis());
      // gradlewで実行した場合に5秒経過する前に実行されることがあるため1ms多めにスリープする
      Thread.sleep(wait.toMillis() + 1);

      String expectedFormattedTargetDate = targetInfoApiClient.formatTargetDateTime(target);

      // 実行
      task.execute();

      // 検証
      // AuthApiが3回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(3));
      // TargetInfoApiが3回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getTargetInfoRequestAll(targetInfoApiConfig),
          VerificationTimes.exactly(3));
      // Axispotにレスポンスのデータが格納されていないこと
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(0, result.size());
      // VdlAuthが呼ばれていないこと
      mockServerClient.verify(
          MockServerTestHelper.getVdlAuthRequest(vdlApiConfig), VerificationTimes.never());
      // VdlDataが呼ばれていないこと
      mockServerClient.verify(
          MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig),
          VerificationTimes.never());
      // レスポンスファイルが削除されていないこと
      // 設定ファイル「target.tier4.target-info-api.target-info.request.parameters」を参照
      logger.info(
          targetInfoApiClient
              .getSaveFilePath(expectedFormattedTargetDate, "16777215", "12345678")
              .toFile()
              .toString());
      assertTrue(
          targetInfoApiClient
              .getSaveFilePath(expectedFormattedTargetDate, "16777215", "12345678")
              .toFile()
              .exists());
      assertTrue(
          targetInfoApiClient
              .getSaveFilePath(expectedFormattedTargetDate, "0", "22222222")
              .toFile()
              .exists());
      assertTrue(
          targetInfoApiClient
              .getSaveFilePath(expectedFormattedTargetDate, "1", "33333333")
              .toFile()
              .exists());
      // バックアップディレクトリが削除されていないこと
      File backupDir =
          Paths.get(
                  targetInfoApiConfig.targetInfo().response().save().directory(),
                  expectedFormattedTargetDate,
                  "backup")
              .toFile();
      assertTrue(backupDir.exists());
    }
  }
}
