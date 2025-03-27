package com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.axispot;

import static org.junit.jupiter.api.Assertions.*;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.TargetInformation;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.test.AxispotClientTestHelper;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.test.TargetInformationTestHelper;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import java.time.ZoneId;
import java.util.Set;
import jp.co.ntt.sic.MovingObjectKey;
import jp.co.ntt.sic.MovingObjectStoreData;
import jp.co.ntt.sic.MovingObjectValue;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.exceptions.JedisClusterOperationException;

@Testcontainers
class AxispotClientTest {
  @Container static GenericContainer<?> container = AxispotClientTestHelper.getContainer();
  private static String storeNodeInfo;

  /** JST */
  private final ZoneId JST = ZoneId.of("Asia/Tokyo");

  /** UTC */
  private final ZoneId UTC = ZoneId.of("UTC");

  @BeforeAll
  static void setup() {
    // コンテナのホスト名とRedisのポート6379とバインドしたポートを取得する
    storeNodeInfo = container.getHost() + ":" + container.getMappedPort(6379);
    AxispotClientTestHelper.updateGeotempConfig("Test Container properties", storeNodeInfo);
  }

  @AfterEach
  public void after() {
    AxispotClientTestHelper.flushDB(HostAndPort.from(storeNodeInfo), 1000);
  }

  @Test
  void constructor_NG() {
    // 不正なパス
    assertThrows(UncheckedIOException.class, () -> new AxispotClient(Path.of("INVALID_PATH")));

    // 接続できないstoreNodeInfo
    AxispotClientTestHelper.updateGeotempConfig("Invalid storeNodeInfo", "127.0.0.2:65535");
    assertThrows(
        JedisClusterOperationException.class,
        () -> new AxispotClient(Path.of(AxispotClientTestHelper.getGeotempConfig())));
  }

  @Test
  void close() {
    // 準備
    AxispotClient client = new AxispotClient(Path.of(AxispotClientTestHelper.getGeotempConfig()));

    // 実行
    client.close();

    // 検証
    // 複数回呼び出されても問題ないこと
    client.close();
    // close後に格納や検索を呼ぶとIllegalStateExceptionが発生すること
    TargetInformation targetInformation =
        TargetInformationTestHelper.createTestData(UTC, "", 0.0, 0.0, 0.0, 0);
    assertThrows(IllegalStateException.class, () -> client.set(targetInformation));
    assertThrows(IllegalStateException.class, () -> client.search(0, 0, 0, 0, 38));
  }

  @Test
  void set() {
    // 準備
    try (AxispotClient client =
        new AxispotClient(Path.of(AxispotClientTestHelper.getGeotempConfig()))) {
      TargetInformation targetInformation =
          TargetInformationTestHelper.createTestData(UTC, "test", 1.1, 2.2, 3.3, 4);

      // 実行
      client.set(targetInformation);

      // 検証
      // 格納したデータが検索できるか
      Set<MovingObjectStoreData> actualHit = client.search(4, 1.1, 2.2, 3.3, 52);
      assertEquals(1, actualHit.size());
      assertEquals("test", actualHit.stream().findFirst().get().getMovingObjectId());
    }
  }

  @Test
  void getMovingObjectKey() {
    // 準備
    TargetInformation targetInformation =
        TargetInformationTestHelper.createTestData(UTC, "test", 1.1, 2.2, 3.3, 4);

    // 実行
    MovingObjectKey actual = AxispotClient.getMovingObjectKey(targetInformation);

    // 検証
    assertEquals("test", actual.getMovingObjectId());
    assertEquals(1.1, actual.getLongitude(), 0.0);
    assertEquals(2.2, actual.getLatitude(), 0.0);
    // 時空間インデックスの高度インデックスを0固定にするため高度は0m固定となる
    assertEquals(0.0, actual.getAltitude(), 0.0);
    assertEquals(4, actual.getTime());
  }

  @Test
  void getMovingObjectValue() {
    // 準備
    TargetInformation targetInformation =
        TargetInformationTestHelper.createTestData(UTC, "test", 1.1, 2.2, 3.3, 4);

    // 実行
    MovingObjectValue actual = AxispotClient.getMovingObjectValue(targetInformation);

    // 検証
    // longitudeがx
    assertEquals(1.1, actual.getCoord().x, 0.0);
    // latitudeがy
    assertEquals(2.2, actual.getCoord().y, 0.0);
    // altitudeがz
    assertEquals(3.3, actual.getCoord().z, 0.0);
    // timeはepoch秒からepochミリ秒に変換されていること
    assertEquals(4000, actual.getCreatedAt().getTime());
    // キーと値が正しく設定されているか
    assertEquals(70, actual.getAttributes().size());
    assertEquals(String.valueOf("dataModelType"), actual.getAttributes().get("dataModelType"));
    assertEquals(String.valueOf(100), actual.getAttributes().get("serviceLocationID"));
    assertEquals(String.valueOf(0), actual.getAttributes().get("roadsideUnitID"));
    assertEquals(
        String.valueOf("2024-01-23T01:23:45.678Z"), actual.getAttributes().get("updateTimeInfo"));
    assertEquals(String.valueOf(1), actual.getAttributes().get("formatVersion"));
    assertEquals(String.valueOf(101), actual.getAttributes().get("deviceNum"));
    assertEquals(String.valueOf(2), actual.getAttributes().get("deviceID"));
    assertEquals(String.valueOf(3), actual.getAttributes().get("targetNum"));
    assertEquals(String.valueOf(4), actual.getAttributes().get("commonServiceStandardID"));
    assertEquals(String.valueOf(5), actual.getAttributes().get("targetMessageID"));
    assertEquals(String.valueOf(6), actual.getAttributes().get("targetIndividualVersionInfo"));
    assertEquals(String.valueOf(7), actual.getAttributes().get("targetID"));
    assertEquals(String.valueOf(8), actual.getAttributes().get("targetIndividualIncrementCounter"));
    assertEquals(String.valueOf(9), actual.getAttributes().get("dataLength"));
    assertEquals(String.valueOf(10), actual.getAttributes().get("individualOptionFlag"));
    assertEquals(String.valueOf(true), actual.getAttributes().get("leapSecondCorrectionInfo"));
    assertEquals(
        String.valueOf("2024-01-23T01:23:45.678+09:00"), actual.getAttributes().get("time"));
    assertEquals(String.valueOf(11), actual.getAttributes().get("latitude"));
    assertEquals(String.valueOf(12), actual.getAttributes().get("longitude"));
    assertEquals(String.valueOf(13), actual.getAttributes().get("elevation"));
    assertEquals(String.valueOf(14), actual.getAttributes().get("positionConf"));
    assertEquals(String.valueOf(15), actual.getAttributes().get("elevationConf"));
    assertEquals(String.valueOf(16), actual.getAttributes().get("speed"));
    assertEquals(String.valueOf(17), actual.getAttributes().get("heading"));
    assertEquals(String.valueOf(18), actual.getAttributes().get("acceleration"));
    assertEquals(String.valueOf(19), actual.getAttributes().get("speedConf"));
    assertEquals(String.valueOf(20), actual.getAttributes().get("headingConf"));
    assertEquals(String.valueOf(21), actual.getAttributes().get("forwardRearAccelerationConf"));
    assertEquals(String.valueOf(22), actual.getAttributes().get("transmissionState"));
    assertEquals(String.valueOf(23), actual.getAttributes().get("steeringWheelAngle"));
    assertEquals(String.valueOf(24), actual.getAttributes().get("sizeClassification"));
    assertEquals(String.valueOf(25), actual.getAttributes().get("roleClassification"));
    assertEquals(String.valueOf(26), actual.getAttributes().get("vehicleWidth"));
    assertEquals(String.valueOf(27), actual.getAttributes().get("vehicleLength"));
    assertEquals(String.valueOf(28), actual.getAttributes().get("positionDelay"));
    assertEquals(String.valueOf(29), actual.getAttributes().get("revisionCounter"));
    assertEquals(String.valueOf(30), actual.getAttributes().get("roadFacilities"));
    assertEquals(String.valueOf(31), actual.getAttributes().get("roadClassification"));
    assertEquals(
        String.valueOf(32), actual.getAttributes().get("semiMajorAxisOfPositionalErrorEllipse"));
    assertEquals(
        String.valueOf(33), actual.getAttributes().get("semiMinorAxisOfPositionalErrorEllipse"));
    assertEquals(
        String.valueOf(34),
        actual.getAttributes().get("semiMajorAxisOrientationOfPositionalErrorEllipse"));
    assertEquals(String.valueOf(35), actual.getAttributes().get("GPSPositioningMode"));
    assertEquals(String.valueOf(36), actual.getAttributes().get("GPSPDOP"));
    assertEquals(String.valueOf(37), actual.getAttributes().get("numberOfGPSSatellitesInUse"));
    assertEquals(String.valueOf(38), actual.getAttributes().get("GPSMultiPathDetection"));
    assertEquals(String.valueOf(false), actual.getAttributes().get("deadReckoningAvailability"));
    assertEquals(String.valueOf(true), actual.getAttributes().get("mapMatchingAvailability"));
    assertEquals(String.valueOf(39), actual.getAttributes().get("yawRate"));
    assertEquals(String.valueOf(40), actual.getAttributes().get("brakeAppliedStatus"));
    assertEquals(String.valueOf(41), actual.getAttributes().get("auxiliaryBrakeAppliedStatus"));
    assertEquals(String.valueOf(42), actual.getAttributes().get("throttlePosition"));
    assertEquals(String.valueOf(43), actual.getAttributes().get("exteriorLights"));
    assertEquals(String.valueOf(44), actual.getAttributes().get("adaptiveCruiseControlStatus"));
    assertEquals(
        String.valueOf(45), actual.getAttributes().get("cooperativeAdaptiveCruiseControlStatus"));
    assertEquals(String.valueOf(46), actual.getAttributes().get("preCrashSafetyStatus"));
    assertEquals(String.valueOf(47), actual.getAttributes().get("antilockBrakeStatus"));
    assertEquals(String.valueOf(48), actual.getAttributes().get("tractionControlStatus"));
    assertEquals(
        String.valueOf(49), actual.getAttributes().get("electronicStabilityControlStatus"));
    assertEquals(String.valueOf(50), actual.getAttributes().get("laneKeepingAssistStatus"));
    assertEquals(String.valueOf(51), actual.getAttributes().get("laneDepartureWarningStatus"));
    assertEquals(
        String.valueOf(52),
        actual.getAttributes().get("intersectionDistanceInformationAvailability"));
    assertEquals(String.valueOf(53), actual.getAttributes().get("intersectionDistance"));
    assertEquals(
        String.valueOf(54),
        actual.getAttributes().get("intersectionPositionInformationAvailability"));
    assertEquals(String.valueOf(55), actual.getAttributes().get("intersectionLatitude"));
    assertEquals(String.valueOf(56), actual.getAttributes().get("intersectionLongitude"));
    assertEquals(String.valueOf(57), actual.getAttributes().get("extendedInformation"));
    assertEquals(
        String.valueOf("targetIndividualExtendedData"),
        actual.getAttributes().get("targetIndividualExtendedData"));
    assertEquals(String.valueOf(58), actual.getAttributes().get("restingState"));
    assertEquals(String.valueOf(59), actual.getAttributes().get("existingTime"));
  }

  @Test
  void getMovingObjectValue_required() {
    // 準備
    TargetInformation targetInformation =
        TargetInformationTestHelper.createTestDataRequired(UTC, "test", 1.1, 2.2, 3.3, 4);

    // 実行
    MovingObjectValue actual = AxispotClient.getMovingObjectValue(targetInformation);

    // 検証
    // longitudeがx
    assertEquals(1.1, actual.getCoord().x, 0.0);
    // latitudeがy
    assertEquals(2.2, actual.getCoord().y, 0.0);
    // altitudeがz
    assertEquals(3.3, actual.getCoord().z, 0.0);
    // timeはepoch秒からepochミリ秒に変換されていること
    assertEquals(4000, actual.getCreatedAt().getTime());
    // キーと値が正しく設定されているか
    assertEquals(33, actual.getAttributes().size());
    assertNull(actual.getAttributes().get("dataModelType"));
    assertEquals(String.valueOf(100), actual.getAttributes().get("serviceLocationID"));
    assertEquals(String.valueOf(0), actual.getAttributes().get("roadsideUnitID"));
    assertEquals(
        String.valueOf("2024-01-23T01:23:45.678Z"), actual.getAttributes().get("updateTimeInfo"));
    assertEquals(String.valueOf(1), actual.getAttributes().get("formatVersion"));
    assertEquals(String.valueOf(101), actual.getAttributes().get("deviceNum"));
    assertEquals(String.valueOf(2), actual.getAttributes().get("deviceID"));
    assertEquals(String.valueOf(3), actual.getAttributes().get("targetNum"));
    assertEquals(String.valueOf(4), actual.getAttributes().get("commonServiceStandardID"));
    assertEquals(String.valueOf(5), actual.getAttributes().get("targetMessageID"));
    assertEquals(String.valueOf(6), actual.getAttributes().get("targetIndividualVersionInfo"));
    assertEquals(String.valueOf(7), actual.getAttributes().get("targetID"));
    assertEquals(String.valueOf(8), actual.getAttributes().get("targetIndividualIncrementCounter"));
    assertEquals(String.valueOf(9), actual.getAttributes().get("dataLength"));
    assertNull(actual.getAttributes().get("individualOptionFlag"));
    assertEquals(String.valueOf(true), actual.getAttributes().get("leapSecondCorrectionInfo"));
    assertEquals(
        String.valueOf("2024-01-23T01:23:45.678+09:00"), actual.getAttributes().get("time"));
    assertEquals(String.valueOf(11), actual.getAttributes().get("latitude"));
    assertEquals(String.valueOf(12), actual.getAttributes().get("longitude"));
    assertEquals(String.valueOf(13), actual.getAttributes().get("elevation"));
    assertEquals(String.valueOf(14), actual.getAttributes().get("positionConf"));
    assertEquals(String.valueOf(15), actual.getAttributes().get("elevationConf"));
    assertEquals(String.valueOf(16), actual.getAttributes().get("speed"));
    assertEquals(String.valueOf(17), actual.getAttributes().get("heading"));
    assertEquals(String.valueOf(18), actual.getAttributes().get("acceleration"));
    assertEquals(String.valueOf(19), actual.getAttributes().get("speedConf"));
    assertEquals(String.valueOf(20), actual.getAttributes().get("headingConf"));
    assertEquals(String.valueOf(21), actual.getAttributes().get("forwardRearAccelerationConf"));
    assertEquals(String.valueOf(22), actual.getAttributes().get("transmissionState"));
    assertEquals(String.valueOf(23), actual.getAttributes().get("steeringWheelAngle"));
    assertEquals(String.valueOf(24), actual.getAttributes().get("sizeClassification"));
    assertEquals(String.valueOf(25), actual.getAttributes().get("roleClassification"));
    assertEquals(String.valueOf(26), actual.getAttributes().get("vehicleWidth"));
    assertEquals(String.valueOf(27), actual.getAttributes().get("vehicleLength"));
    assertNull(actual.getAttributes().get("positionDelay"));
    assertNull(actual.getAttributes().get("revisionCounter"));
    assertNull(actual.getAttributes().get("roadFacilities"));
    assertNull(actual.getAttributes().get("roadClassification"));
    assertNull(null, actual.getAttributes().get("semiMajorAxisOfPositionalErrorEllipse"));
    assertNull(null, actual.getAttributes().get("semiMinorAxisOfPositionalErrorEllipse"));
    assertNull(
        null, actual.getAttributes().get("semiMajorAxisOrientationOfPositionalErrorEllipse"));
    assertNull(null, actual.getAttributes().get("GPSPositioningMode"));
    assertNull(null, actual.getAttributes().get("GPSPDOP"));
    assertNull(null, actual.getAttributes().get("numberOfGPSSatellitesInUse"));
    assertNull(null, actual.getAttributes().get("GPSMultiPathDetection"));
    assertNull(null, actual.getAttributes().get("deadReckoningAvailability"));
    assertNull(null, actual.getAttributes().get("mapMatchingAvailability"));
    assertNull(null, actual.getAttributes().get("yawRate"));
    assertNull(null, actual.getAttributes().get("brakeAppliedStatus"));
    assertNull(null, actual.getAttributes().get("auxiliaryBrakeAppliedStatus"));
    assertNull(null, actual.getAttributes().get("throttlePosition"));
    assertNull(null, actual.getAttributes().get("exteriorLights"));
    assertNull(null, actual.getAttributes().get("adaptiveCruiseControlStatus"));
    assertNull(null, actual.getAttributes().get("cooperativeAdaptiveCruiseControlStatus"));
    assertNull(null, actual.getAttributes().get("preCrashSafetyStatus"));
    assertNull(null, actual.getAttributes().get("antilockBrakeStatus"));
    assertNull(null, actual.getAttributes().get("tractionControlStatus"));
    assertNull(null, actual.getAttributes().get("electronicStabilityControlStatus"));
    assertNull(null, actual.getAttributes().get("laneKeepingAssistStatus"));
    assertNull(null, actual.getAttributes().get("laneDepartureWarningStatus"));
    assertNull(null, actual.getAttributes().get("intersectionDistanceInformationAvailability"));
    assertNull(null, actual.getAttributes().get("intersectionDistance"));
    assertNull(null, actual.getAttributes().get("intersectionPositionInformationAvailability"));
    assertNull(null, actual.getAttributes().get("intersectionLatitude"));
    assertNull(null, actual.getAttributes().get("intersectionLongitude"));
    assertNull(null, actual.getAttributes().get("extendedInformation"));
    assertNull(null, actual.getAttributes().get("targetIndividualExtendedData"));
    assertNull(null, actual.getAttributes().get("restingState"));
    assertNull(null, actual.getAttributes().get("existingTime"));
  }

  @Test
  void search() {
    // 準備
    try (AxispotClient client =
        new AxispotClient(Path.of(AxispotClientTestHelper.getGeotempConfig()))) {
      TargetInformation targetInformation =
          TargetInformationTestHelper.createTestData(UTC, "test", 1.1, 2.2, 3.3, 4);
      client.set(targetInformation);

      // 実行
      Set<MovingObjectStoreData> actualEmpty = client.search(0, 0.0, 0.0, 0.0, 52);
      Set<MovingObjectStoreData> actualHit = client.search(4, 1.1, 2.2, 3.3, 52);
      Set<MovingObjectStoreData> actualHitAltIdxFix0 = client.search(4, 1.1, 2.2, 33554432.0, 52);
      // 検証
      // HITなし
      assertEquals(0, actualEmpty.size());
      // HITあり
      assertEquals(1, actualHit.size());
      // HITあり（高度インデックスが0固定で検索されていること）
      assertEquals(1, actualHitAltIdxFix0.size());
      // 時空間インデックスの高度インデックスを0固定にするため高度が異常値であっても例外は発生しないこと
      try {
        client.search(0, 0.0, 0.0, 33554433.0, 52);
      } catch (Exception e) {
        fail();
      }
      // 不正な検索条件の場合はIllegalArgumentExceptionが発生すること
      assertThrows(IllegalArgumentException.class, () -> client.search(-1, 0.0, 0.0, 0.0, 52));
      assertThrows(IllegalArgumentException.class, () -> client.search(0, 181.0, 0.0, 0.0, 52));
      assertThrows(IllegalArgumentException.class, () -> client.search(0, 0.0, 86.0, 0.0, 52));
      assertThrows(IllegalArgumentException.class, () -> client.search(0, 0.0, 0.0, 0.0, 52 - 4));
    }
  }
}
