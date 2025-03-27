package com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.axispot;

import static org.junit.jupiter.api.Assertions.*;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.VehicleInformation;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.test.AxispotClientTestHelper;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.test.VehicleInformationTestHelper;
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
    VehicleInformation vehicleInformation =
        VehicleInformationTestHelper.createTestData(UTC, "", 0.0, 0.0, 0.0, 0);
    assertThrows(IllegalStateException.class, () -> client.set(vehicleInformation));
    assertThrows(IllegalStateException.class, () -> client.search(0, 0, 0, 0, 38));
  }

  @Test
  void set() {
    // 準備
    try (AxispotClient client =
        new AxispotClient(Path.of(AxispotClientTestHelper.getGeotempConfig()))) {
      VehicleInformation vehicleInformation =
          VehicleInformationTestHelper.createTestData(UTC, "test", 1.1, 2.2, 3.3, 4);

      // 実行
      client.set(vehicleInformation);

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
    VehicleInformation vehicleInformation =
        VehicleInformationTestHelper.createTestData(UTC, "test", 1.1, 2.2, 3.3, 4);

    // 実行
    MovingObjectKey actual = AxispotClient.getMovingObjectKey(vehicleInformation);

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
    VehicleInformation vehicleInformation =
        VehicleInformationTestHelper.createTestData(UTC, "test", 1.1, 2.2, 3.3, 4);

    // 実行
    MovingObjectValue actual = AxispotClient.getMovingObjectValue(vehicleInformation);

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
    assertEquals(9, actual.getAttributes().size());
    assertEquals("spatialId", actual.getAttributes().get("spatialId"));
    assertEquals("dataModelType", actual.getAttributes().get("dataModelType"));
    assertEquals("vehicleId", actual.getAttributes().get("vehicleId"));
    assertEquals("vehicleName", actual.getAttributes().get("vehicleName"));
    assertEquals("status", actual.getAttributes().get("status"));
    assertEquals("lat", actual.getAttributes().get("lat"));
    assertEquals("lng", actual.getAttributes().get("lng"));
    assertEquals("height", actual.getAttributes().get("height"));
    assertEquals("updatedAt", actual.getAttributes().get("updatedAt"));
  }

  @Test
  void getMovingObjectValue_required() {
    // 準備
    VehicleInformation vehicleInformation =
        VehicleInformationTestHelper.createTestDataRequired(UTC, "test", 1.1, 2.2, 3.3, 4);

    // 実行
    MovingObjectValue actual = AxispotClient.getMovingObjectValue(vehicleInformation);

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
    assertEquals(5, actual.getAttributes().size());
    assertEquals("spatialId", actual.getAttributes().get("spatialId"));
    assertEquals("dataModelType", actual.getAttributes().get("dataModelType"));
    assertNull(actual.getAttributes().get("vehicleId"));
    assertNull(actual.getAttributes().get("vehicleName"));
    assertNull(actual.getAttributes().get("status"));
    assertEquals("lat", actual.getAttributes().get("lat"));
    assertEquals("lng", actual.getAttributes().get("lng"));
    assertEquals("height", actual.getAttributes().get("height"));
    assertNull(actual.getAttributes().get("updatedAt"));
  }

  @Test
  void search() {
    // 準備
    try (AxispotClient client =
        new AxispotClient(Path.of(AxispotClientTestHelper.getGeotempConfig()))) {
      VehicleInformation vehicleInformation =
          VehicleInformationTestHelper.createTestData(UTC, "test", 1.1, 2.2, 3.3, 4);
      client.set(vehicleInformation);

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
