package com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 気象情報
 *
 * <p>気象情報Builderを利用して生成すること。
 */
public class WeatherInformation {

  /** 気象情報の種別Enum */
  public enum Type {
    /** 実況 */
    Actual,
    /** 予測 */
    Forecast,
    /** コピー */
    Copy,
  }

  /** Axispotの時空間データの属性のキー */
  static class Attribute {
    /** 空間ID */
    static final String spatialId = "spatialId";

    /** 種別 */
    static final String type = "type";

    /** 気温 */
    static final String temperature = "temperature";

    /** 降水量 */
    static final String precipitation = "precipitation";

    /** 湿度 */
    static final String humidity = "humidity";

    /** 天気 */
    static final String weatherForecast = "weatherForecast";

    /** 風向 */
    static final String windDirection = "windDirection";

    /** 風速 */
    static final String windSpeed = "windSpeed";

    /** 更新日時 */
    static final String updatedAt = "updatedAt";
  }

  private final String id;
  private final double longitude;
  private final double latitude;
  private final double altitude;
  private final ZonedDateTime time;
  private final String spatialId;
  private final Type type;
  private final String temperature;
  private final String precipitation;
  private final String humidity;
  private final String weatherForecast;
  private final String windDirection;
  private final String windSpeed;
  private final ZonedDateTime updatedAt;

  /** 気象情報Builderから生成する。 */
  private WeatherInformation(
      String id,
      double longitude,
      double latitude,
      double altitude,
      ZonedDateTime time,
      String spatialId,
      Type type,
      String temperature,
      String precipitation,
      String humidity,
      String weatherForecast,
      String windDirection,
      String windSpeed,
      ZonedDateTime updatedAt) {
    this.id = id;
    this.longitude = longitude;
    this.latitude = latitude;
    this.altitude = altitude;
    this.time = time;
    this.spatialId = spatialId;
    this.type = type;
    this.temperature = temperature;
    this.precipitation = precipitation;
    this.humidity = humidity;
    this.weatherForecast = weatherForecast;
    this.windDirection = windDirection;
    this.windSpeed = windSpeed;
    this.updatedAt = updatedAt;
  }

  /**
   * 識別子を取得する。
   *
   * <p>気象情報の対象日時のISO8601形式を設定する。
   *
   * <p>AxispotのMovingObjectStoreData.getMovingObjectId()に対応する。
   *
   * @return 識別子
   */
  public String getId() {
    return id;
  }

  /**
   * 経度を取得する。
   *
   * <p>時空間インデックスの算出に用いる経度と同じ値を設定する。
   *
   * <p>AxispotのMovingObjectStoreData.getCoord().xに対応する。
   *
   * @return 経度
   */
  public double getLongitude() {
    return longitude;
  }

  /**
   * 緯度を取得する。
   *
   * <p>時空間インデックスの算出に用いる緯度と同じ値を設定する。
   *
   * <p>AxispotのMovingObjectStoreData.getCoord().yに対応する。
   *
   * @return 緯度
   */
  public double getLatitude() {
    return latitude;
  }

  /**
   * 高度を取得する。
   *
   * <p>時空間インデックスの算出に用いる高度と同じ値を設定する。
   *
   * <p>AxispotのMovingObjectStoreData.getCoord().zに対応する。
   *
   * @return 高度
   */
  public double getAltitude() {
    return altitude;
  }

  /**
   * 時間を取得する。
   *
   * <p>時空間インデックスの算出に用いる時間と同じ値を設定する。
   *
   * <p>AxispotのMovingObjectStoreData.getCreatedAt()に対応する。
   *
   * @return 時間
   */
  public ZonedDateTime getTime() {
    return time;
  }

  /**
   * 空間ID（ズームレベル15）を取得する。
   *
   * <p>空間IDのズームレベル15を設定する。（例） 15/0/0/0
   *
   * <p>AxispotのMovingObjectStoreData.getAttributes().get("spatialId")に対応する。
   *
   * @return 空間ID（ズームレベル15）
   */
  public String getSpatialId() {
    return spatialId;
  }

  /**
   * 種別を取得する。
   *
   * <p>AxispotのMovingObjectStoreData.getAttributes().get("type")に対応する。
   *
   * @return 種別
   */
  public Type getType() {
    return type;
  }

  /**
   * 気温を取得する。
   *
   * <p>AxispotのMovingObjectStoreData.getAttributes().get("temperature")に対応する。
   *
   * @return 気温
   */
  public String getTemperature() {
    return temperature;
  }

  /**
   * 降水量を取得する。
   *
   * <p>AxispotのMovingObjectStoreData.getAttributes().get("precipitation")に対応する。
   *
   * @return 降水量
   */
  public String getPrecipitation() {
    return precipitation;
  }

  /**
   * 湿度を取得する。
   *
   * <p>AxispotのMovingObjectStoreData.getAttributes().get("humidity")に対応する。
   *
   * @return 湿度
   */
  public String getHumidity() {
    return humidity;
  }

  /**
   * 天気を取得する。
   *
   * <p>AxispotのMovingObjectStoreData.getAttributes().get("weatherForecast")に対応する。
   *
   * @return 天気
   */
  public String getWeatherForecast() {
    return weatherForecast;
  }

  /**
   * 風向を取得する。
   *
   * <p>AxispotのMovingObjectStoreData.getAttributes().get("windDirection")に対応する。
   *
   * @return 風向
   */
  public String getWindDirection() {
    return windDirection;
  }

  /**
   * 風速を取得する。
   *
   * <p>AxispotのMovingObjectStoreData.getAttributes().get("windSpeed")に対応する。
   *
   * @return 風速
   */
  public String getWindSpeed() {
    return windSpeed;
  }

  /**
   * 更新日時を取得する。
   *
   * <p>AxispotのMovingObjectStoreData.getAttributes().get("updatedAt")に対応する。
   *
   * @return 更新日時
   */
  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }

  /**
   * Axispotの時空間データの属性Mapに変換する。
   *
   * @return Axispotの時空間データの属性Map
   */
  public Map<String, String> toAttributes() {
    Map<String, String> result = new HashMap<>();
    result.put(Attribute.spatialId, spatialId);
    result.put(Attribute.type, type.name());
    result.put(Attribute.temperature, temperature);
    result.put(Attribute.precipitation, precipitation);
    result.put(Attribute.humidity, humidity);
    result.put(Attribute.weatherForecast, weatherForecast);
    result.put(Attribute.windDirection, windDirection);
    result.put(Attribute.windSpeed, windSpeed);
    result.put(Attribute.updatedAt, updatedAt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
    return result;
  }

  /**
   * Builderに変換する。
   *
   * @return 気象情報Builder
   */
  public Builder toBuilder() {
    return new Builder()
        .id(this.getId())
        .latitude(this.getLatitude())
        .longitude(this.getLongitude())
        .altitude(this.getAltitude())
        .time(this.getTime())
        .spatialId(this.getSpatialId())
        .type(this.getType())
        .temperature(this.getTemperature())
        .precipitation(this.getPrecipitation())
        .humidity(this.getHumidity())
        .weatherForecast(this.getWeatherForecast())
        .windDirection(this.getWindDirection())
        .windSpeed(this.getWindSpeed())
        .updatedAt(this.getUpdatedAt());
  }

  /**
   * 気象情報Builderを生成する。
   *
   * @return 気象情報Builder
   */
  public static Builder builder() {
    return new Builder();
  }

  /** 気象情報Builder */
  public static class Builder {
    private String id;
    private double longitude;
    private double latitude;
    private double altitude;
    private ZonedDateTime time;
    private String spatialId;
    private Type type;
    private String temperature;
    private String precipitation;
    private String humidity;
    private String weatherForecast;
    private String windDirection;
    private String windSpeed;
    private ZonedDateTime updatedAt;

    /** 生成する。 */
    public Builder() {}

    /**
     * 識別子を設定する。
     *
     * <p>気象情報の対象日時のISO8601形式を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getMovingObjectId()に対応する。
     *
     * @param id 識別子
     * @return this
     */
    public Builder id(String id) {
      this.id = id;
      return this;
    }

    /**
     * 経度を設定する。
     *
     * <p>時空間インデックスの算出に用いる経度と同じ値を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getCoord().xに対応する。
     *
     * @param longitude 経度
     * @return this
     */
    public Builder longitude(double longitude) {
      this.longitude = longitude;
      return this;
    }

    /**
     * 緯度を設定する。
     *
     * <p>時空間インデックスの算出に用いる緯度と同じ値を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getCoord().yに対応する。
     *
     * @param latitude 緯度
     * @return this
     */
    public Builder latitude(double latitude) {
      this.latitude = latitude;
      return this;
    }

    /**
     * 高度を設定する。
     *
     * <p>時空間インデックスの算出に用いる高度と同じ値を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getCoord().zに対応する。
     *
     * @param altitude 高度
     * @return this
     */
    public Builder altitude(double altitude) {
      this.altitude = altitude;
      return this;
    }

    /**
     * 時間を設定する。
     *
     * <p>時空間インデックスの算出に用いる時間と同じ値を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getCreatedAt()に対応する。
     *
     * @param time 時間
     * @return this
     */
    public Builder time(ZonedDateTime time) {
      this.time = time;
      return this;
    }

    /**
     * 空間ID（ズームレベル15）を設定する。
     *
     * <p>空間IDのズームレベル15を設定する。（例） 15/0/0/0
     *
     * <p>AxispotのMovingObjectStoreData.getAttributes().get("spatialId")に対応する。
     *
     * @param spatialId 空間ID（ズームレベル15）
     * @return this
     */
    public Builder spatialId(String spatialId) {
      this.spatialId = spatialId;
      return this;
    }

    /**
     * 種別を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getAttributes().get("type")に対応する。
     *
     * @param type 種別
     * @return this
     */
    public Builder type(Type type) {
      this.type = type;
      return this;
    }

    /**
     * 気温を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getAttributes().get("temperature")に対応する。
     *
     * @param temperature 気温
     * @return this
     */
    public Builder temperature(String temperature) {
      this.temperature = temperature;
      return this;
    }

    /**
     * 降水量を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getAttributes().get("precipitation")に対応する。
     *
     * @param precipitation 降水量
     * @return this
     */
    public Builder precipitation(String precipitation) {
      this.precipitation = precipitation;
      return this;
    }

    /**
     * 湿度を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getAttributes().get("humidity")に対応する。
     *
     * @param humidity 湿度
     * @return this
     */
    public Builder humidity(String humidity) {
      this.humidity = humidity;
      return this;
    }

    /**
     * 天気を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getAttributes().get("weatherForecast")に対応する。
     *
     * @param weatherForecast 天気
     * @return this
     */
    public Builder weatherForecast(String weatherForecast) {
      this.weatherForecast = weatherForecast;
      return this;
    }

    /**
     * 風向を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getAttributes().get("windDirection")に対応する。
     *
     * @param windDirection 風向
     * @return this
     */
    public Builder windDirection(String windDirection) {
      this.windDirection = windDirection;
      return this;
    }

    /**
     * 風速を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getAttributes().get("windSpeed")に対応する。
     *
     * @param windSpeed 風速
     * @return this
     */
    public Builder windSpeed(String windSpeed) {
      this.windSpeed = windSpeed;
      return this;
    }

    /**
     * 更新日時を設定する。
     *
     * <p>気象情報の更新日時を設定する。
     *
     * <p>AxispotのMovingObjectStoreData.getAttributes().get("updatedAt")に対応する。
     *
     * @param updatedAt 更新日時
     * @return this
     */
    public Builder updatedAt(ZonedDateTime updatedAt) {
      this.updatedAt = updatedAt;
      return this;
    }

    /**
     * 気象情報を生成する。
     *
     * @return 気象情報
     */
    public WeatherInformation build() {
      return new WeatherInformation(
          this.id,
          this.longitude,
          this.latitude,
          this.altitude,
          this.time,
          this.spatialId,
          this.type,
          this.temperature,
          this.precipitation,
          this.humidity,
          this.weatherForecast,
          this.windDirection,
          this.windSpeed,
          this.updatedAt);
    }
  }
}
