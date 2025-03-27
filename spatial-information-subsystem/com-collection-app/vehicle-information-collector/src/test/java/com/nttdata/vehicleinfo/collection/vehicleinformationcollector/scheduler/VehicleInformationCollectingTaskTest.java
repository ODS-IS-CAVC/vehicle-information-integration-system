package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.scheduler;

import static com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test.DynamicPropertySourceTestHelper.Keys.VEHICLE_AUTH_API_LOGIN_KEY;
import static com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test.DynamicPropertySourceTestHelper.Keys.VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD;
import static com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test.DynamicPropertySourceTestHelper.Keys.VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID;
import static com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test.DynamicPropertySourceTestHelper.Keys.VEHICLE_TIER4_DIGITAL_ZENSO_API_KEY;
import static com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test.DynamicPropertySourceTestHelper.Keys.VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET;
import static com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test.DynamicPropertySourceTestHelper.Keys.VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.nttdata.vdl.api.client.VdlApiConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.AuthApiConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.AxispotConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.DigitalZensoApiConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.VehicleVdlApiConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.service.DigitalZensoApiClient;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test.AxispotTestHelper;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test.ContainerConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test.MockServerTestHelper;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test.VehiclesResponseParserTestHelper;
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
  MockServerTestHelper.CustomProperties.VEHICLE_AUTH_API_LOGIN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VEHICLE_TIER4_DIGITAL_ZENSO_API_VEHICLES_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VEHICLE_VDL_API_TOKEN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VEHICLE_VDL_API_DATA_REQUEST_ENDPOINT
})
@SpringBootTest
@Import(ContainerConfig.class)
class VehicleInformationCollectingTaskTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;
  @Autowired private VehicleInformationCollectingTask task;
  @Autowired private DigitalZensoApiClient digitalZensoApiClient;
  @Autowired private DigitalZensoApiConfig digitalZensoApiConfig;
  @Autowired private AxispotConfig axispotConfig;
  @Autowired private GenericContainer<?> vehiclesAxispotRedis;
  @Autowired private AuthApiConfig authApiConfig;
  @Autowired private VehicleVdlApiConfig vehicleVdlApiConfig;

  private VdlApiConfig vdlApiConfig;

  @PostConstruct
  void init() {
    this.vdlApiConfig = vehicleVdlApiConfig.getApi();
  }

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) throws URISyntaxException {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(VEHICLE_TIER4_DIGITAL_ZENSO_API_KEY, () -> "TEST");
    registry.add(VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_KEY, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD, () -> "TEST");

    // レスポンスファイルの保存ディレクトリのパスをリソースから取得してプロパティに設定
    String saveDir =
        new File(
                MethodHandles.lookup()
                    .lookupClass()
                    .getClassLoader()
                    .getResource("data/tier4-digitalzensoapi/vehicles")
                    .toURI())
            .toString();
    registry.add("vehicle.tier4.digital-zenso-api.vehicles.response.save.directory", () -> saveDir);

    // Axispotの設定ファイルのパスをリソースから取得してプロパティに設定
    String geotempConfig =
        new File(
                MethodHandles.lookup()
                    .lookupClass()
                    .getClassLoader()
                    .getResource("axispot/geotempConfig.properties")
                    .toURI())
            .toString();
    registry.add("vehicle.axispot.geotemp.config", () -> geotempConfig);

    logger.info(registry.toString());
  }

  @BeforeAll
  static void setup(
      @Autowired AxispotConfig axispotConfig, @Autowired GenericContainer<?> vehiclesAxispotRedis) {
    String config = axispotConfig.geotemp().config();
    try (FileInputStream input = new FileInputStream(config)) {
      Properties properties = new Properties();
      properties.load(input);
      // コンテナのホスト名とRedisのポート6379とバインドしたポートを取得する
      String storeNodeInfo =
          vehiclesAxispotRedis.getHost() + ":" + vehiclesAxispotRedis.getMappedPort(6379);
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
    // 準備
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();

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
      // VdlAuth OK
      mockServerClient
          .when(MockServerTestHelper.getVdlAuthRequest(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlAuthResponseOk());
      // VdlData OK
      mockServerClient
          .when(MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlDataResponsePostCreated201());

      // 5秒後の日時を計算して、それまで待機することで対象日時をコントロールする
      ZonedDateTime now = ZonedDateTime.now(digitalZensoApiConfig.vehicles().timeZoneToZoneId());
      ZonedDateTime target = now.plusSeconds(5).minusNanos(now.getNano());
      Duration wait = Duration.between(now, target);
      logger.info("target={} now={} wait={}", target, now, wait.toMillis());
      // gradlewで実行した場合に5秒経過する前に実行されることがあるため1ms多めにスリープする
      Thread.sleep(wait.toMillis() + 1);

      String expectedFormattedTargetDate = digitalZensoApiClient.formatTargetDateTime(target);

      // 実行
      task.execute();

      // 検証
      // AuthApiが1回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(1));
      // DigitalZensoApiが1回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
          VerificationTimes.exactly(1));
      // Axispotにレスポンスのデータ（1件）が格納されていること
      assertEquals(1, axispotTestHelper.keysAll().length);
      // VdlAuthが1回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVdlAuthRequest(vdlApiConfig), VerificationTimes.exactly(1));
      // VdlDataが1回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig),
          VerificationTimes.exactly(1));
      // レスポンスファイルが削除されていること
      assertFalse(
          digitalZensoApiClient.getSaveFilePath(expectedFormattedTargetDate).toFile().exists());
    }
  }

  @Test
  void execute_AuthNg() {
    // AuthApiのユーザー認証に失敗した場合は後続処理をスキップして終了する

    // 準備
    // AuthApi NG
    // debug-auth-skip=false
    assertFalse(digitalZensoApiConfig.debugAuthSkip());
    mockServerClient
        .when(MockServerTestHelper.getLoginRequest(authApiConfig))
        .respond(MockServerTestHelper.getLoginResponseNg());
    // DigitalZensoApi OK
    mockServerClient
        .when(MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig))
        .respond(MockServerTestHelper.getVehiclesResponse20241119000000());

    // 実行
    task.execute();

    // 検証
    // AuthApiが1回呼ばれていること
    mockServerClient.verify(
        MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(1));
    // DigitalZensoApiは呼ばれないこと
    mockServerClient.verify(
        MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
        VerificationTimes.exactly(0));
  }

  @Test
  void saveToAxispot_OK_20241119000000() {

    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();

      // 20241119000000
      ZonedDateTime target =
          ZonedDateTime.of(
              2024, 11, 19, 0, 0, 0, 0, digitalZensoApiConfig.vehicles().timeZoneToZoneId());
      String formatted = digitalZensoApiClient.formatTargetDateTime(target);
      // 実行
      task.saveToAxispot(formatted);

      // 検証

      // Axispot検索条件
      // vehicles_masking.json
      double lon = 139.74258640456;
      double lat = 35.6242681254456;
      double alt = 0.01258640981;
      int searchPrecision = 52;
      String updatedAt = "2014-10-10T04:50:40.000001+00:00";

      ZonedDateTime updatedAtZonedDateTime =
          ZonedDateTime.parse(updatedAt, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
      long time = updatedAtZonedDateTime.toEpochSecond();

      // 時空間データ検索でHITすることを確認する
      int count = axispotTestHelper.count(time, lon, lat, alt, searchPrecision);
      assertEquals(1, count);

      // Redisの検索でデータの件数が正しいかを確認する
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(1, result.size());
    } catch (Exception e) {
      Assertions.fail(e);
    }
  }

  @Test
  void saveToAxispot_OK_20241120090000() {
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();

      // 20241120090000
      ZonedDateTime target =
          ZonedDateTime.of(
              2024, 11, 20, 9, 0, 0, 0, digitalZensoApiConfig.vehicles().timeZoneToZoneId());
      String formatted = digitalZensoApiClient.formatTargetDateTime(target);
      // 実行
      task.saveToAxispot(formatted);

      // 検証

      // Axispot検索条件
      // vehicles_20241120090000.json
      double lon = 1.1;
      double lat = 0.0;
      double alt = 2.2;
      int searchPrecision = 52;
      String updatedAt = "2024-11-20T09:00:00.000000+00:00";

      ZonedDateTime updatedAtZonedDateTime =
          ZonedDateTime.parse(updatedAt, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
      long time = updatedAtZonedDateTime.toEpochSecond();

      // 時空間データ検索でHITすることを確認する
      int count = axispotTestHelper.count(time, lon, lat, alt, searchPrecision);
      assertEquals(1, count);

      // Redisの検索でデータの件数が正しいかを確認する
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(2, result.size());
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

      // 実行
      task.saveToAxispot("zero");

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
      assertDoesNotThrow(() -> VehiclesResponseParserTestHelper.getRequired());

      // 実行
      task.saveToAxispot(VehiclesResponseParserTestHelper.REQUIRED_TARGET_DATE_TIME);

      // Redisの検索でデータの件数が正しいかを確認する
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(1, result.size());

      Map<String, String> attributes = result.stream().findFirst().get().getAttributes();
      // 必須のみ+updatedAtであれば6項目であること
      assertEquals(6, attributes.size());

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
      assertDoesNotThrow(() -> VehiclesResponseParserTestHelper.getIllegalLocationSpatialId());

      // 実行
      task.saveToAxispot(
          VehiclesResponseParserTestHelper.ILLEGAL_LOCATION_SPATIAL_ID_TARGET_DATE_TIME);

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
      assertDoesNotThrow(() -> VehiclesResponseParserTestHelper.getIllegalLocationAxispot());

      // 実行
      task.saveToAxispot(
          VehiclesResponseParserTestHelper.ILLEGAL_LOCATION_AXISPOT_TARGET_DATE_TIME);

      // Redisの検索でデータの件数が正しいかを確認する
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(0, result.size());
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
    Path dir =
        Paths.get(digitalZensoApiConfig.vehicles().response().save().directory(), targetDate);
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
    List<File> actual = task.getResponseFileList("20241120090000");

    // 検証
    assertEquals(1, actual.size());
    assertEquals("vehicles_20241120090000.json", actual.getFirst().getName());
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
        Paths.get(digitalZensoApiConfig.vehicles().response().save().directory(), targetDate);
    Files.createDirectory(dir);
    // 実行
    List<File> actual = task.getResponseFileList(targetDate);
    // 検証
    assertEquals(0, actual.size());
  }
}

@MockServerTest({
  MockServerTestHelper.CustomProperties.VEHICLE_AUTH_API_LOGIN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VEHICLE_TIER4_DIGITAL_ZENSO_API_VEHICLES_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VEHICLE_VDL_API_TOKEN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VEHICLE_VDL_API_DATA_REQUEST_ENDPOINT
})
@SpringBootTest
@Import(ContainerConfig.class)
@ActiveProfiles({"ut", "masking-enabled-true"})
class MaskingEnabledTrueTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;
  @Autowired private VehicleInformationCollectingTask task;
  @Autowired private DigitalZensoApiClient digitalZensoApiClient;
  @Autowired private DigitalZensoApiConfig digitalZensoApiConfig;
  @Autowired private AxispotConfig axispotConfig;
  @Autowired private GenericContainer<?> vehiclesAxispotRedis;
  @Autowired private AuthApiConfig authApiConfig;
  @Autowired private VehicleVdlApiConfig vehicleVdlApiConfig;

  private VdlApiConfig vdlApiConfig;

  @PostConstruct
  void init() {
    this.vdlApiConfig = vehicleVdlApiConfig.getApi();
  }

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) throws URISyntaxException {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(VEHICLE_TIER4_DIGITAL_ZENSO_API_KEY, () -> "TEST");
    registry.add(VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_KEY, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD, () -> "TEST");

    // レスポンスファイルの保存ディレクトリのパスをリソースから取得してプロパティに設定
    String saveDir =
        new File(
                MethodHandles.lookup()
                    .lookupClass()
                    .getClassLoader()
                    .getResource("data/tier4-digitalzensoapi/vehicles")
                    .toURI())
            .toString();
    registry.add("vehicle.tier4.digital-zenso-api.vehicles.response.save.directory", () -> saveDir);

    // Axispotの設定ファイルのパスをリソースから取得してプロパティに設定
    String geotempConfig =
        new File(
                MethodHandles.lookup()
                    .lookupClass()
                    .getClassLoader()
                    .getResource("axispot/geotempConfig.properties")
                    .toURI())
            .toString();
    registry.add("vehicle.axispot.geotemp.config", () -> geotempConfig);

    logger.info(registry.toString());
  }

  @BeforeAll
  static void setup(
      @Autowired AxispotConfig axispotConfig, @Autowired GenericContainer<?> vehiclesAxispotRedis) {
    String config = axispotConfig.geotemp().config();
    try (FileInputStream input = new FileInputStream(config)) {
      Properties properties = new Properties();
      properties.load(input);
      // コンテナのホスト名とRedisのポート6379とバインドしたポートを取得する
      String storeNodeInfo =
          vehiclesAxispotRedis.getHost() + ":" + vehiclesAxispotRedis.getMappedPort(6379);
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
      .attribute[] |= (
          .vehicleName="***"
      )
      """;
  // マスク処理後の期待値
  String masked =
      """
      {
        "dataModelType": "test1",
        "attribute": [
          {
            "vehicleId": "78aa302c-1600-44b3-a331-e4659c0b28a1",
            "vehicleName": "***",
            "status": "driving",
            "location": {
              "lat": 35.6242681254456,
              "lng": 139.74258640456,
              "height": 0.01258640981
            },
            "updatedAt": "2014-10-10T04:50:40.000001+00:00"
          },
          {
            "vehicleId": "78aa302c-1600-44b3-a331-e4659c0b28a1",
            "vehicleName": "***",
            "status": "driving",
            "location": {
              "lat": 35.6242681254456,
              "lng": 139.74258640456,
              "height": 0.01258640981
            },
            "updatedAt": "2014-10-10T04:50:40.000001+00:00"
          }
        ]
      }
      """;

  @Test
  void applyMasking() throws IOException {
    // 準備
    ObjectMapper objectMapper = new ObjectMapper();
    // マスク処理が有効であること
    assertTrue(digitalZensoApiConfig.vehicles().response().save().masking().enabled());
    // vehicleNameのみをマスクするクエリであること
    assertEquals(query, digitalZensoApiConfig.vehicles().response().save().masking().query());
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
    // 準備
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();

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
      // VdlAuth OK
      mockServerClient
          .when(MockServerTestHelper.getVdlAuthRequest(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlAuthResponseOk());
      // VdlData OK
      mockServerClient
          .when(MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlDataResponsePostCreated201());

      // 5秒後の日時を計算して、それまで待機することで対象日時をコントロールする
      ZonedDateTime now = ZonedDateTime.now(digitalZensoApiConfig.vehicles().timeZoneToZoneId());
      ZonedDateTime target = now.plusSeconds(5).minusNanos(now.getNano());
      Duration wait = Duration.between(now, target);
      logger.info("target={} now={} wait={}", target, now, wait.toMillis());
      // gradlewで実行した場合に5秒経過する前に実行されることがあるため1ms多めにスリープする
      Thread.sleep(wait.toMillis() + 1);

      String expectedFormattedTargetDate = digitalZensoApiClient.formatTargetDateTime(target);

      // 実行
      task.execute();

      // 検証
      // AuthApiが1回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(1));
      // DigitalZensoApiが1回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
          VerificationTimes.exactly(1));
      // Axispotにレスポンスのデータ（1件）が格納されていること
      Set<MovingObjectStoreData> result = axispotTestHelper.getAll();
      assertEquals(1, result.size());
      // vehicleNameがマスクされていること
      for (MovingObjectStoreData data : result) {
        assertEquals("***", data.getAttributes().get("vehicleName"));
        logger.info("MovingObjectStoreData: {}", data);
      }
      // VdlAuthが1回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVdlAuthRequest(vdlApiConfig), VerificationTimes.exactly(1));
      // VdlDataが1回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig),
          VerificationTimes.exactly(1));
      // レスポンスファイルが削除されていること
      assertFalse(
          digitalZensoApiClient.getSaveFilePath(expectedFormattedTargetDate).toFile().exists());
      // バックアップディレクトリが削除されていること
      File backupDir =
          Paths.get(
                  digitalZensoApiConfig.vehicles().response().save().directory(),
                  expectedFormattedTargetDate,
                  "backup")
              .toFile();
      assertFalse(backupDir.exists());
    }
  }

  @Test
  void applyMasking_NG() {
    // 準備
    String targetDateTime = "masking_ng_create_backup_dir";
    // マスク処理が有効であること
    assertTrue(digitalZensoApiConfig.vehicles().response().save().masking().enabled());
    // バックアップディレクトリと同名のファイルが存在すること
    File file =
        Paths.get(
                digitalZensoApiConfig.vehicles().response().save().directory(),
                targetDateTime,
                "backup")
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
}

@MockServerTest({
  MockServerTestHelper.CustomProperties.VEHICLE_AUTH_API_LOGIN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VEHICLE_TIER4_DIGITAL_ZENSO_API_VEHICLES_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VEHICLE_VDL_API_TOKEN_REQUEST_ENDPOINT,
  MockServerTestHelper.CustomProperties.VEHICLE_VDL_API_DATA_REQUEST_ENDPOINT
})
@SpringBootTest
@Import(ContainerConfig.class)
@ActiveProfiles({"ut", "masking-fail-safe"})
class MaskingFailSafeTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // @MockServerTestによってインジェクションされる（@Autowiredは不要）
  private MockServerClient mockServerClient;
  @Autowired private VehicleInformationCollectingTask task;
  @Autowired private DigitalZensoApiClient digitalZensoApiClient;
  @Autowired private DigitalZensoApiConfig digitalZensoApiConfig;
  @Autowired private AxispotConfig axispotConfig;
  @Autowired private GenericContainer<?> vehiclesAxispotRedis;
  @Autowired private AuthApiConfig authApiConfig;
  @Autowired private VehicleVdlApiConfig vehicleVdlApiConfig;

  private VdlApiConfig vdlApiConfig;

  @PostConstruct
  void init() {
    this.vdlApiConfig = vehicleVdlApiConfig.getApi();
  }

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) throws URISyntaxException {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(VEHICLE_TIER4_DIGITAL_ZENSO_API_KEY, () -> "TEST");
    registry.add(VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_KEY, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID, () -> "TEST");
    registry.add(VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD, () -> "TEST");

    // レスポンスファイルの保存ディレクトリのパスをリソースから取得してプロパティに設定
    String saveDir =
        new File(
                MethodHandles.lookup()
                    .lookupClass()
                    .getClassLoader()
                    .getResource("data/tier4-digitalzensoapi/vehicles")
                    .toURI())
            .toString();
    registry.add("vehicle.tier4.digital-zenso-api.vehicles.response.save.directory", () -> saveDir);

    // Axispotの設定ファイルのパスをリソースから取得してプロパティに設定
    String geotempConfig =
        new File(
                MethodHandles.lookup()
                    .lookupClass()
                    .getClassLoader()
                    .getResource("axispot/geotempConfig.properties")
                    .toURI())
            .toString();
    registry.add("vehicle.axispot.geotemp.config", () -> geotempConfig);

    logger.info(registry.toString());
  }

  @BeforeAll
  static void setup(
      @Autowired AxispotConfig axispotConfig, @Autowired GenericContainer<?> vehiclesAxispotRedis) {
    String config = axispotConfig.geotemp().config();
    try (FileInputStream input = new FileInputStream(config)) {
      Properties properties = new Properties();
      properties.load(input);
      // コンテナのホスト名とRedisのポート6379とバインドしたポートを取得する
      String storeNodeInfo =
          vehiclesAxispotRedis.getHost() + ":" + vehiclesAxispotRedis.getMappedPort(6379);
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
      .attribute[] |= (
          invalid_test(.vehicleName="***")
      )
      """;

  @Test
  void applyMasking_fail_safe() {
    // 準備
    String targetDateTime = "masking_fail_safe";
    // マスク処理が有効であること
    assertTrue(digitalZensoApiConfig.vehicles().response().save().masking().enabled());
    // 不正なクエリであること
    assertEquals(
        invalidQuery, digitalZensoApiConfig.vehicles().response().save().masking().query());
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
    // 準備
    try (AxispotTestHelper axispotTestHelper =
        new AxispotTestHelper(Paths.get(axispotConfig.geotemp().config()))) {
      // 準備
      axispotTestHelper.flushDB();

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
      // VdlAuth OK
      mockServerClient
          .when(MockServerTestHelper.getVdlAuthRequest(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlAuthResponseOk());
      // VdlData OK
      mockServerClient
          .when(MockServerTestHelper.getVdlDataRequestPostAnyVdlPathAnyBody(vdlApiConfig))
          .respond(MockServerTestHelper.getVdlDataResponsePostCreated201());

      // 5秒後の日時を計算して、それまで待機することで対象日時をコントロールする
      ZonedDateTime now = ZonedDateTime.now(digitalZensoApiConfig.vehicles().timeZoneToZoneId());
      ZonedDateTime target = now.plusSeconds(5).minusNanos(now.getNano());
      Duration wait = Duration.between(now, target);
      logger.info("target={} now={} wait={}", target, now, wait.toMillis());
      // gradlewで実行した場合に5秒経過する前に実行されることがあるため1ms多めにスリープする
      Thread.sleep(wait.toMillis() + 1);

      String expectedFormattedTargetDate = digitalZensoApiClient.formatTargetDateTime(target);

      // 実行
      task.execute();

      // 検証
      // AuthApiが1回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getLoginRequest(authApiConfig), VerificationTimes.exactly(1));
      // DigitalZensoApiが1回呼ばれていること
      mockServerClient.verify(
          MockServerTestHelper.getVehiclesRequest(digitalZensoApiConfig),
          VerificationTimes.exactly(1));
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
      assertTrue(
          digitalZensoApiClient.getSaveFilePath(expectedFormattedTargetDate).toFile().exists());
      // バックアップディレクトリが削除されていないこと
      File backupDir =
          Paths.get(
                  digitalZensoApiConfig.vehicles().response().save().directory(),
                  expectedFormattedTargetDate,
                  "backup")
              .toFile();
      assertTrue(backupDir.exists());
    }
  }
}
