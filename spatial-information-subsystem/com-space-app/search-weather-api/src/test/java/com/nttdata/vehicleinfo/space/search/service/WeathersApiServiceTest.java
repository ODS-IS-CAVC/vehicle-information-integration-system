package com.nttdata.vehicleinfo.space.search.service;

import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;
import static org.assertj.core.api.Assertions.assertThat;

import com.nttdata.vehicleinfo.space.search.ContainerConfig;
import com.nttdata.vehicleinfo.space.search.TestUtils;
import com.nttdata.vehicleinfo.space.search.axispot.SpatialId;
import com.nttdata.vehicleinfo.space.search.axispot.WeatherAttributes;
import com.nttdata.vehicleinfo.space.search.config.AxispotConfig;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
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
public class WeathersApiServiceTest {

  // テストデータ格納用
  @Autowired
  @Qualifier("geotemp")
  private Geotemp geotemp;

  // redisクリア用
  @Autowired private AxispotConfig axispotConfig;

  @Autowired private WeathersApiService weathersApiService;

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
    OffsetDateTime baseTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));

    // テストデータの格納
    TestUtils.setDataToWeather(
        geotemp, spatialId, baseTime, 140.6195068359375, 36.5140511994, 1, baseTime);

    // 検索の実行(検索時間幅は1時間)
    OffsetDateTime from = baseTime;
    OffsetDateTime to = baseTime.plusHours(1);
    List<MovingObjectStoreData> data =
        weathersApiService.searchObjects(from, to, SpatialId.parse(spatialId));

    // 検証
    assertThat(data).hasSize(1);
  }

  @Test
  public void searchDuplicateData() {
    String spatialId = "15/0/29183/12809";
    OffsetDateTime baseTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));

    // テストデータの格納
    TestUtils.setDataToWeather(
        geotemp, spatialId, baseTime, 140.6195068359375, 36.5140511994, 1, baseTime);
    // updatedAtの新しい値をデータを格納する
    TestUtils.setDataToWeather(
        geotemp, spatialId, baseTime, 140.6195068359375, 36.5140511994, 1, baseTime.plusHours(1));

    // 検索の実行(検索時間幅は1時間)
    OffsetDateTime from = baseTime;
    OffsetDateTime to = baseTime.plusHours(1);
    List<MovingObjectStoreData> data =
        weathersApiService.searchObjects(from, to, SpatialId.parse(spatialId));

    // 検証
    assertThat(data).hasSize(1);
  }

  /** 検索範囲外のデータが検索されてないことを確認する. */
  @Test
  public void searchOutOfTime() {
    String spatialId = "15/0/29183/12809";
    OffsetDateTime baseTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));

    // テストデータの格納
    TestUtils.setDataToWeather(
        geotemp, spatialId, baseTime, 140.6195068359375, 36.5140511994, 1, baseTime);
    // 検索範囲外のデータ
    TestUtils.setDataToWeather(
        geotemp,
        spatialId,
        baseTime.plusHours(2),
        140.6195068359375,
        36.5140511994,
        1,
        baseTime.plusHours(2));

    // 検索の実行(検索時間幅は1時間)
    OffsetDateTime from = baseTime;
    OffsetDateTime to = baseTime.plusHours(1);
    List<MovingObjectStoreData> data =
        weathersApiService.searchObjects(from, to, SpatialId.parse(spatialId));

    // 検証
    assertThat(data).hasSize(1);
  }

  /** SpatialIDで指定されたメッシュ範囲外のデータが検索されないことを確認する. */
  @Test
  public void searchOutOfArea() {
    String spatialId = "15/0/29183/12809";
    OffsetDateTime baseTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));

    // テストデータの格納
    TestUtils.setDataToWeather(
        geotemp, spatialId, baseTime, 140.6195068359375, 36.5140511994, 1, baseTime);
    // 検索範囲外(15/29183/12810)のデータ
    TestUtils.setDataToWeather(
        geotemp, spatialId, baseTime, 140.6195068359375, 36.5052208633, 1, baseTime);

    // 検索の実行(検索時間幅は1時間)
    OffsetDateTime from = baseTime;
    OffsetDateTime to = baseTime.plusHours(1);
    List<MovingObjectStoreData> data =
        weathersApiService.searchObjects(from, to, SpatialId.parse(spatialId));

    // 検証
    assertThat(data).hasSize(1);
  }

  /** 予測値と実測値のデータをマージする */
  @Test
  public void searchWithActual() {
    String spatialId = "15/0/29183/12809";
    OffsetDateTime baseTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));

    // テストデータの格納
    TestUtils.setDataToWeather(
        geotemp, spatialId, baseTime, 140.6195068359375, 36.5140511994, 1, baseTime);
    // updatedAtの新しい値を持つ実測値のデータを格納する
    TestUtils.setActualDataToWeather(
        geotemp,
        spatialId,
        baseTime,
        140.6195068359375,
        36.5140511994,
        1,
        10.0,
        100.0,
        baseTime.plusMinutes(25));

    // 検索の実行(検索時間幅は1時間)
    OffsetDateTime from = baseTime;
    OffsetDateTime to = baseTime.plusHours(1);
    List<MovingObjectStoreData> data =
        weathersApiService.searchObjects(from, to, SpatialId.parse(spatialId));

    // 検証
    assertThat(data).hasSize(1);
    // 気温、降水量、更新日時は実測値の値となること
    assertThat(data.getFirst().getAttributes().get(WeatherAttributes.TEMPERATURE.getKey()))
        .isEqualTo("10.0");
    assertThat(data.getFirst().getAttributes().get(WeatherAttributes.PRECIPITATION.getKey()))
        .isEqualTo("100.0");
    assertThat(data.getFirst().getAttributes().get(WeatherAttributes.UPDATED_AT.getKey()))
        .isEqualTo(ISO_OFFSET_DATE_TIME.format(baseTime.plusMinutes(25)));
    // それ以外は実測値の値にならないこと
    assertThat(data.getFirst().getAttributes().get(WeatherAttributes.HUMIDITY.getKey()))
        .isNotEqualTo("65535.0");
    assertThat(data.getFirst().getAttributes().get(WeatherAttributes.WEATHER_FORECAST.getKey()))
        .isNotEqualTo("65535.0");
    assertThat(data.getFirst().getAttributes().get(WeatherAttributes.WIND_DIRECTION.getKey()))
        .isNotEqualTo("65535.0");
    assertThat(data.getFirst().getAttributes().get(WeatherAttributes.WIND_SPEED.getKey()))
        .isNotEqualTo("65535.0");
  }
}
