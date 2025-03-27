package com.nttdata.vehicleinfo.space.search.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.nttdata.vehicleinfo.space.search.ContainerConfig;
import com.nttdata.vehicleinfo.space.search.TestUtils;
import com.nttdata.vehicleinfo.space.search.axispot.SpatialId;
import com.nttdata.vehicleinfo.space.search.config.AxispotConfig;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import jp.co.ntt.sic.Geotemp;
import jp.co.ntt.sic.MovingObjectStoreData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.testcontainers.junit.jupiter.Testcontainers;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisCluster;

@SpringBootTest
@Testcontainers
@Import(ContainerConfig.class)
public class VehiclesApiServiceTest {

  @Autowired
  @Qualifier("geotemp")
  private Geotemp geotemp;

  // redisクリア用
  @Autowired private AxispotConfig axispotConfig;

  @Autowired private VehiclesApiService vehiclesApiService;

  /** テストごとにRedisデータをクリアする. */
  @BeforeEach
  public void setUp() {
    // Testcontainersで起動しているRedisにつなぐ
    // ContainerConfigで登録しているRedisの接続先は1つなのでそのまま":"で分割する
    String[] storeNodeInfo = axispotConfig.storeNodeInfo().split(":");
    HostAndPort hostAndPort = new HostAndPort(storeNodeInfo[0], Integer.parseInt(storeNodeInfo[1]));
    try (JedisCluster jedis = new JedisCluster(hostAndPort)) {
      jedis.flushAll();
    }
  }

  @Test
  public void searchData() {
    String spatialId = "15/0/29183/12809";
    UUID vehicleId = UUID.randomUUID();
    OffsetDateTime baseTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));

    // テストデータの格納
    // SpatialIDにはズームレベル25相当の値を入れる
    // 36.5140511994,140.6195068359375は15/0/29183/12809のど真ん中なため、
    // このデータは25/0/29883903/13116927の右下に位置する
    TestUtils.setDataToVehicle(
        geotemp,
        "25/0/29883903/13116927",
        baseTime,
        140.6195068359375,
        36.5140511994,
        1,
        vehicleId,
        baseTime);

    // 検索の実行(検索時間幅は1時間)
    OffsetDateTime from = baseTime;
    OffsetDateTime to = baseTime.plusHours(1);
    List<MovingObjectStoreData> data =
        vehiclesApiService.searchObjects(from, to, SpatialId.parse(spatialId));

    // 検証
    assertThat(data).hasSize(1);
  }

  @Test
  public void searchDuplicateData() {
    String spatialId = "15/0/29183/12809";
    UUID vehicleId = UUID.randomUUID();
    OffsetDateTime baseTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));

    // テストデータの格納
    TestUtils.setDataToVehicle(
        geotemp,
        "25/0/29883903/13116927",
        baseTime,
        140.6195068359375,
        36.5140511994,
        1,
        vehicleId,
        baseTime);
    // updatedAtの新しい値をデータを格納する
    TestUtils.setDataToVehicle(
        geotemp,
        "25/0/29883903/13116927",
        baseTime,
        140.6195068359375,
        36.5140511994,
        1,
        vehicleId,
        baseTime.plusHours(1));

    // 検索の実行(検索時間幅は1時間)
    OffsetDateTime from = baseTime;
    OffsetDateTime to = baseTime.plusHours(1);
    List<MovingObjectStoreData> data =
        vehiclesApiService.searchObjects(from, to, SpatialId.parse(spatialId));

    // 検証
    assertThat(data).hasSize(1);
  }

  @Test
  public void searchOutOfTime() {
    String spatialId = "15/0/29183/12809";
    UUID vehicleId = UUID.randomUUID();
    OffsetDateTime baseTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));

    // テストデータの格納
    TestUtils.setDataToVehicle(
        geotemp,
        "25/0/29883903/13116927",
        baseTime,
        140.6195068359375,
        36.5140511994,
        1,
        vehicleId,
        baseTime);
    // 検索範囲外のデータ
    // 検索終了時刻+1sのデータは検索されない
    TestUtils.setDataToVehicle(
        geotemp,
        "25/0/29883903/13116927",
        baseTime.plusHours(1).plusSeconds(1),
        140.6195068359375,
        36.5140511994,
        1,
        vehicleId,
        baseTime.plusHours(1).plusSeconds(1));

    // 検索の実行(検索時間幅は1時間)
    OffsetDateTime from = baseTime;
    OffsetDateTime to = baseTime.plusHours(1);
    List<MovingObjectStoreData> data =
        vehiclesApiService.searchObjects(from, to, SpatialId.parse(spatialId));

    // 検証
    assertThat(data).hasSize(1);
  }

  /** SpatialIDで指定されたメッシュ範囲外のデータが検索されないことを確認する. */
  @Test
  public void searchOutOfArea() {
    String spatialId = "15/0/29183/12809";
    UUID vehicleId = UUID.randomUUID();
    OffsetDateTime baseTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));

    // テストデータの格納
    TestUtils.setDataToVehicle(
        geotemp,
        "25/0/29883903/13116927",
        baseTime,
        140.6195068359375,
        36.5140511994,
        1,
        vehicleId,
        baseTime);
    // 検索範囲外(15/29183/12810)の中心座標のデータ
    TestUtils.setDataToVehicle(
        geotemp,
        "25/0/29883903/13117951",
        baseTime,
        140.6195068359375,
        36.5052208633,
        1,
        vehicleId,
        baseTime);

    // 検索の実行(検索時間幅は1時間)
    OffsetDateTime from = baseTime;
    OffsetDateTime to = baseTime.plusHours(1);
    List<MovingObjectStoreData> data =
        vehiclesApiService.searchObjects(from, to, SpatialId.parse(spatialId));

    // 検証
    assertThat(data).hasSize(1);
  }

  @Test
  public void searchMixedVehicleAndTarget() {
    String spatialId = "15/0/29183/12809";
    UUID vehicleId = UUID.randomUUID();
    OffsetDateTime baseTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));

    // テストデータの格納
    TestUtils.setDataToVehicle(
        geotemp,
        "25/0/29883903/13116927",
        baseTime,
        140.6195068359375,
        36.5140511994,
        1,
        vehicleId,
        baseTime);
    // 同じ時刻、座標に物標情報も追加する
    TestUtils.setDataToTarget(
        geotemp,
        "25/0/29883903/13116927",
        baseTime,
        140.6195068359375,
        36.5140511994,
        1,
        1L,
        baseTime);

    // 検索の実行(検索時間幅は1時間)
    OffsetDateTime from = baseTime;
    OffsetDateTime to = baseTime.plusHours(1);
    List<MovingObjectStoreData> data =
        vehiclesApiService.searchObjects(from, to, SpatialId.parse(spatialId));

    // 検証
    assertThat(data).hasSize(1);
  }
}
