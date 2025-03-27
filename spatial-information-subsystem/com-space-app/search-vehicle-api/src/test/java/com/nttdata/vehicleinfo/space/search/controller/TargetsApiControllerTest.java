package com.nttdata.vehicleinfo.space.search.controller;

import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;
import static org.assertj.core.api.Assertions.assertThat;

import com.nttdata.vehicleinfo.space.search.ContainerConfig;
import com.nttdata.vehicleinfo.space.search.TestUtils;
import com.nttdata.vehicleinfo.space.search.config.AxispotConfig;
import com.nttdata.vehicleinfo.space.search.model.TargetInfo;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import jp.co.ntt.sic.Geotemp;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.testcontainers.junit.jupiter.Testcontainers;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisCluster;

@SpringBootTest
@Testcontainers
@Import(ContainerConfig.class)
public class TargetsApiControllerTest {

  // テストデータ格納用
  @Autowired
  @Qualifier("geotemp")
  private Geotemp geotemp;

  // redisクリア用
  @Autowired private AxispotConfig axispotConfig;

  @Autowired private TargetsApiController targetsApiController;

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
  public void searchVehicles() {
    String spatialId = "15/0/29183/12809";
    long targetId = 1L;
    OffsetDateTime baseTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));

    // テストデータの格納
    // SpatialIDにはズームレベル25相当の値を入れる
    // 36.5140511994,140.6195068359375は15/0/29183/12809のど真ん中なため、
    // このデータは25/0/29883903/13116927の右下に位置する
    TestUtils.setDataToTarget(
        geotemp,
        "25/0/29883903/13116927",
        baseTime,
        140.6195068359375,
        36.5140511994,
        1,
        targetId,
        baseTime);

    // 検索の実行(検索時間幅は1時間)
    List<String> spatialIds = List.of(spatialId);
    OffsetDateTime from = baseTime;
    OffsetDateTime to = baseTime.plusHours(1);
    ResponseEntity<TargetInfo> response = targetsApiController.searchTargets(from, to, spatialIds);

    // 検証
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().getTargetStartDateTime()).isEqualTo(from);
    assertThat(response.getBody().getTargetEndDateTime()).isEqualTo(to);
    assertThat(response.getBody().getSpaces()).hasSize(1);
    // 検索時の空間IDが設定されていること
    assertThat(response.getBody().getSpaces().getFirst().getSpatialID()).isEqualTo(spatialId);
    // 各種値がテストデータと一致すること
    assertThat(response.getBody().getSpaces().getFirst().getTargets().getTargetID())
        .isEqualTo(targetId);
    assertThat(response.getBody().getSpaces().getFirst().getTargets().getSpatialID())
        .isEqualTo("25/0/29883903/13116927");
    assertThat(response.getBody().getSpaces().getFirst().getTargets().getTime())
        .isEqualTo(ISO_OFFSET_DATE_TIME.format(baseTime));
  }

  @Test
  public void searchMultiSpatial() {
    String spatialId1 = "15/0/29183/12809";
    long targetId1 = 1L;
    String spatialId2 = "15/0/29183/12810";
    long targetId2 = 2L;
    OffsetDateTime baseTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));

    // テストデータの格納
    TestUtils.setDataToTarget(
        geotemp,
        "25/0/29883903/13116927",
        baseTime,
        140.6195068359375,
        36.5140511994,
        1,
        targetId1,
        baseTime);
    TestUtils.setDataToTarget(
        geotemp,
        "25/0/29883903/13117951",
        baseTime,
        140.6195068359375,
        36.5052208633,
        1,
        targetId2,
        baseTime);

    // 検索の実行(検索時間幅は1時間)
    List<String> spatialIds = List.of(spatialId1, spatialId2);
    OffsetDateTime from = baseTime;
    OffsetDateTime to = baseTime.plusHours(1);
    ResponseEntity<TargetInfo> response = targetsApiController.searchTargets(from, to, spatialIds);

    // 検証
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().getSpaces()).hasSize(2);
    // 順序が検索時の空間ID順であること
    assertThat(response.getBody().getSpaces().getFirst().getSpatialID()).isEqualTo(spatialId1);
    assertThat(response.getBody().getSpaces().get(1).getSpatialID()).isEqualTo(spatialId2);
  }
}
