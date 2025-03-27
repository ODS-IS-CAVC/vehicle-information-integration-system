package com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.axispot;

import static org.junit.jupiter.api.Assertions.*;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.WeatherInformation;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.test.AxispotClientTestHelper;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
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
    WeatherInformation weatherInformation =
        WeatherInformation.builder().id("test").type(WeatherInformation.Type.Copy).build();
    assertThrows(IllegalStateException.class, () -> client.set(weatherInformation));
    assertThrows(IllegalStateException.class, () -> client.search(0, 0, 0, 0, 38));
  }

  @Test
  void set() {
    // 準備
    ZonedDateTime time = ZonedDateTime.of(1970, 1, 1, 0, 0, 4, 0, ZoneOffset.UTC);
    ZonedDateTime updatedAt = ZonedDateTime.of(2023, 11, 9, 12, 34, 56, 0, ZoneId.of("Asia/Tokyo"));
    try (AxispotClient client =
        new AxispotClient(Path.of(AxispotClientTestHelper.getGeotempConfig()))) {
      WeatherInformation weatherInformation =
          WeatherInformation.builder()
              .id("test")
              .latitude(1.1)
              .longitude(2.2)
              .altitude(3.3)
              .time(time)
              .spatialId("spatialId")
              .type(WeatherInformation.Type.Actual)
              .temperature("temperature")
              .precipitation("precipitation")
              .humidity("humidity")
              .weatherForecast("weatherForecast")
              .windDirection("windDirection")
              .windSpeed("windSpeed")
              .updatedAt(updatedAt)
              .build();

      // 実行
      client.set(weatherInformation);

      // 検証
      // 格納したデータが検索できるか
      Set<MovingObjectStoreData> actualHit = client.search(time.toEpochSecond(), 2.2, 1.1, 3.3, 38);
      assertEquals(1, actualHit.size());
      assertEquals("test", actualHit.stream().findFirst().get().getMovingObjectId());
    }
  }

  @Test
  void getMovingObjectKey() {
    ZonedDateTime time = ZonedDateTime.of(1970, 1, 1, 0, 0, 4, 0, ZoneOffset.UTC);
    ZonedDateTime updatedAt = ZonedDateTime.of(2023, 11, 9, 12, 34, 56, 0, ZoneId.of("Asia/Tokyo"));

    // 準備
    WeatherInformation weatherInformation =
        WeatherInformation.builder()
            .id("test")
            .latitude(1.1)
            .longitude(2.2)
            .altitude(3.3)
            .time(time)
            .spatialId("spatialId")
            .type(WeatherInformation.Type.Actual)
            .temperature("temperature")
            .precipitation("precipitation")
            .humidity("humidity")
            .weatherForecast("weatherForecast")
            .windDirection("windDirection")
            .windSpeed("windSpeed")
            .updatedAt(updatedAt)
            .build();

    // 実行
    MovingObjectKey actual = AxispotClient.getMovingObjectKey(weatherInformation);

    // 検証
    assertEquals("test", actual.getMovingObjectId());
    assertEquals(time.toEpochSecond(), actual.getTime());
    assertEquals(1.1, actual.getLatitude(), 0.0);
    assertEquals(2.2, actual.getLongitude(), 0.0);
    assertEquals(3.3, actual.getAltitude(), 0.0);
  }

  @Test
  void getMovingObjectValue() {
    ZonedDateTime time = ZonedDateTime.of(1970, 1, 1, 0, 0, 4, 0, ZoneOffset.UTC);
    ZonedDateTime updatedAt = ZonedDateTime.of(2023, 11, 9, 12, 34, 56, 0, ZoneId.of("Asia/Tokyo"));

    // 準備
    WeatherInformation weatherInformation =
        WeatherInformation.builder()
            .id("test")
            .latitude(1.1)
            .longitude(2.2)
            .altitude(3.3)
            .time(time)
            .spatialId("spatialId")
            .type(WeatherInformation.Type.Actual)
            .temperature("temperature")
            .precipitation("precipitation")
            .humidity("humidity")
            .weatherForecast("weatherForecast")
            .windDirection("windDirection")
            .windSpeed("windSpeed")
            .updatedAt(updatedAt)
            .build();

    // 実行
    MovingObjectValue actual = AxispotClient.getMovingObjectValue(weatherInformation);

    // 検証
    // timeはepoch秒からepochミリ秒に変換されていること
    assertEquals(time.toEpochSecond() * 1000, actual.getCreatedAt().getTime());
    // latitudeがy
    assertEquals(1.1, actual.getCoord().y, 0.0);
    // longitudeがx
    assertEquals(2.2, actual.getCoord().x, 0.0);
    // altitudeがz
    assertEquals(3.3, actual.getCoord().z, 0.0);
    // キーと値が正しく設定されているか
    assertEquals(9, actual.getAttributes().size());
    assertEquals("spatialId", actual.getAttributes().get("spatialId"));
    assertEquals("Actual", actual.getAttributes().get("type"));
    assertEquals("temperature", actual.getAttributes().get("temperature"));
    assertEquals("precipitation", actual.getAttributes().get("precipitation"));
    assertEquals("humidity", actual.getAttributes().get("humidity"));
    assertEquals("weatherForecast", actual.getAttributes().get("weatherForecast"));
    assertEquals("windDirection", actual.getAttributes().get("windDirection"));
    assertEquals("windSpeed", actual.getAttributes().get("windSpeed"));
    assertEquals(
        updatedAt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME),
        actual.getAttributes().get("updatedAt"));
  }

  @Test
  void search() {
    ZonedDateTime time = ZonedDateTime.of(1970, 1, 1, 0, 0, 4, 0, ZoneOffset.UTC);
    ZonedDateTime updatedAt = ZonedDateTime.of(2023, 11, 9, 12, 34, 56, 0, ZoneId.of("Asia/Tokyo"));

    // 準備
    try (AxispotClient client =
        new AxispotClient(Path.of(AxispotClientTestHelper.getGeotempConfig()))) {
      WeatherInformation weatherInformation =
          WeatherInformation.builder()
              .id("test")
              .latitude(1.1)
              .longitude(2.2)
              .altitude(3.3)
              .time(time)
              .spatialId("spatialId")
              .type(WeatherInformation.Type.Actual)
              .temperature("temperature")
              .precipitation("precipitation")
              .humidity("humidity")
              .weatherForecast("weatherForecast")
              .windDirection("windDirection")
              .windSpeed("windSpeed")
              .updatedAt(updatedAt)
              .build();
      client.set(weatherInformation);

      // 実行
      Set<MovingObjectStoreData> actualEmpty = client.search(0, 0.0, 0.0, 0.0, 38);
      Set<MovingObjectStoreData> actualHit = client.search(time.toEpochSecond(), 2.2, 1.1, 3.3, 38);
      // 検証
      // HITなし
      assertEquals(0, actualEmpty.size());
      // HITあり
      assertEquals(1, actualHit.size());
      // 不正な検索条件の場合はIllegalArgumentExceptionが発生すること
      assertThrows(IllegalArgumentException.class, () -> client.search(-1, 0.0, 0.0, 0.0, 38));
      assertThrows(IllegalArgumentException.class, () -> client.search(0, 181.0, 0.0, 0.0, 38));
      assertThrows(IllegalArgumentException.class, () -> client.search(0, 0.0, 86.0, 0.0, 38));
      assertThrows(
          IllegalArgumentException.class, () -> client.search(0, 0.0, 0.0, 33554433.0, 38));
      assertThrows(IllegalArgumentException.class, () -> client.search(0, 0.0, 0.0, 0.0, 34));
    }
  }
}
