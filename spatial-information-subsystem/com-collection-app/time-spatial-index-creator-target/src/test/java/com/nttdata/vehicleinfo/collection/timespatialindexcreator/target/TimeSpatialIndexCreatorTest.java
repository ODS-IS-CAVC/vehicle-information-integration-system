package com.nttdata.vehicleinfo.collection.timespatialindexcreator.target;

import static org.junit.jupiter.api.Assertions.*;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.test.AxispotClientTestHelper;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.test.TargetInfoResponseParserTestHelper;
import java.nio.file.Path;
import java.time.ZoneId;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import redis.clients.jedis.HostAndPort;

@Testcontainers
class TimeSpatialIndexCreatorTest {

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
  void set() {
    // 準備
    try (TimeSpatialIndexCreator timeSpatialIndexCreator =
        new TimeSpatialIndexCreator(
            Path.of(AxispotClientTestHelper.getGeotempConfig()), UTC, UTC)) {
      // 実行
      try {
        timeSpatialIndexCreator.set(
            TargetInfoResponseParserTestHelper.getResourceAsPath(
                TargetInfoResponseParserTestHelper.EXAMPLE_FILE_NAME));
      } catch (Exception e) {
        // 検証
        // 正常に終了すること
        fail("正常に終了すること");
      }
    }
  }

  @Test
  void set_required() {
    // 準備
    try (TimeSpatialIndexCreator timeSpatialIndexCreator =
        new TimeSpatialIndexCreator(
            Path.of(AxispotClientTestHelper.getGeotempConfig()), UTC, UTC)) {
      // 実行
      try {
        timeSpatialIndexCreator.set(
            TargetInfoResponseParserTestHelper.getResourceAsPath(
                TargetInfoResponseParserTestHelper.REQUIERD_FILE_NAME));
      } catch (Exception e) {
        // 検証
        // 正常に終了すること
        fail("正常に終了すること", e);
      }
    }
  }

  @Test
  void set_illegal_location_spatial_id() {
    // 準備
    try (TimeSpatialIndexCreator timeSpatialIndexCreator =
        new TimeSpatialIndexCreator(
            Path.of(AxispotClientTestHelper.getGeotempConfig()), UTC, UTC)) {
      // 実行
      try {
        timeSpatialIndexCreator.set(
            TargetInfoResponseParserTestHelper.getResourceAsPath(
                TargetInfoResponseParserTestHelper.ILLEGAL_LOCATION_SPATIAL_ID_FILE_NAME));
      } catch (Exception e) {
        // 検証
        // 範囲外の位置データはスキップされて正常に終了すること
        fail("正常に終了すること", e);
      }
    }
  }

  @Test
  void set_illegal_location_axispot() {
    // 準備
    try (TimeSpatialIndexCreator timeSpatialIndexCreator =
        new TimeSpatialIndexCreator(
            Path.of(AxispotClientTestHelper.getGeotempConfig()), UTC, UTC)) {
      // 実行
      try {
        timeSpatialIndexCreator.set(
            TargetInfoResponseParserTestHelper.getResourceAsPath(
                TargetInfoResponseParserTestHelper.ILLEGAL_LOCATION_AXISPOT_FILE_NAME));
      } catch (Exception e) {
        // 検証
        // 範囲外の位置データはスキップされて正常に終了すること
        fail("正常に終了すること", e);
      }
    }
  }

  @Test
  void close() {
    // 準備
    try (TimeSpatialIndexCreator timeSpatialIndexCreator =
        new TimeSpatialIndexCreator(
            Path.of(AxispotClientTestHelper.getGeotempConfig()), UTC, UTC)) {
      // 実行
      timeSpatialIndexCreator.close();

      // 検証
      // close後に格納するとIllegalStateExceptionが発生すること
      assertThrows(
          IllegalStateException.class,
          () ->
              timeSpatialIndexCreator.set(
                  TargetInfoResponseParserTestHelper.getResourceAsPath(
                      TargetInfoResponseParserTestHelper.EXAMPLE_FILE_NAME)));
    }
  }
}
