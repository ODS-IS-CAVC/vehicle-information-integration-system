package com.nttdata.vehicleinfo.space.tool.config;

import java.nio.file.Path;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("testdata")
public class TestDataConfig {

  private final List<Data> data = new ArrayList<>();

  private Path randomDataOutputDir;
  private OffsetDateTime randomDataBaseTime;
  private Duration randomDataDuration;
  private final List<RandomData> randomData = new ArrayList<>();

  private boolean flushData = false;

  public List<Data> getData() {
    return data;
  }

  public List<RandomData> getRandomData() {
    return randomData;
  }

  public void setRandomDataOutputDir(Path randomDataOutputDir) {
    this.randomDataOutputDir = randomDataOutputDir;
  }

  public Path getRandomDataOutputDir() {
    return this.randomDataOutputDir;
  }

  public OffsetDateTime getRandomDataBaseTime() {
    return randomDataBaseTime;
  }

  public void setRandomDataBaseTime(OffsetDateTime randomDataBaseTime) {
    this.randomDataBaseTime = randomDataBaseTime;
  }

  public Duration getRandomDataDuration() {
    return randomDataDuration;
  }

  public void setRandomDataDuration(Duration randomDataDuration) {
    this.randomDataDuration = randomDataDuration;
  }

  public void setFlushData(boolean flushData) {
    this.flushData = flushData;
  }

  public boolean isFlushData() {
    return flushData;
  }

  public record Data(Key key, Map<String, String> attributes) {}

  public record Key(
      OffsetDateTime time,
      double longitude,
      double latitude,
      double altitude,
      String movingObjectId) {}

  /**
   * ランダム生成の定義.
   *
   * @param id シナリオID(出力ファイル名に利用)
   * @param name シナリオ名
   * @param baseTime 生成開始時刻
   * @param duration 生成期間
   * @param interval 生成間隔
   * @param updatedAtOffset 更新日時オフセット
   *     <p>ダミーデータ更新に利用
   * @param templateType データ種別
   * @param areas ダミーデータの生成エリア
   * @param staticAttributes 静的属性情報
   *     <p>ダミーデータの属性情報を固定値にするために利用
   */
  public record RandomData(
      String id,
      String name,
      OffsetDateTime baseTime,
      Duration duration,
      Duration interval,
      Duration updatedAtOffset,
      RandomTemplateType templateType,
      List<Area> areas,
      Map<String, String> staticAttributes) {
    public RandomData {
      if (Objects.isNull(updatedAtOffset)) {
        updatedAtOffset = Duration.ZERO;
      }
    }
  }

  /**
   * データを生成するエリアの定義.
   *
   * @param boundingBoxes BoundingBoxによるランダム指定
   *     <p>複数のBoundingBoxの領域内からランダムな1点が位置情報として利用される。
   * @param coordinate 座標による静的な指定
   *     <p>ダミーデータの生成位置を固定するために利用<br>
   *     指定時、{@code boundingBoxes}の設定は無視される。
   */
  public record Area(List<BoundingBox> boundingBoxes, Coordinate coordinate) {}

  public record BoundingBox(double swLon, double swLat, double neLon, double neLat) {}

  public record Coordinate(double longitude, double latitude, double altitude) {}

  /** データ種別 */
  public enum RandomTemplateType {
    /** 車両 */
    VEHICLE(25),
    /** 物標 */
    TARGET(25),
    /** 気象 */
    WEATHER(15);

    private final int zoomLevel;

    RandomTemplateType(int zoomLevel) {
      this.zoomLevel = zoomLevel;
    }

    public int getZoomLevel() {
      return zoomLevel;
    }
  }
}
