package com.nttdata.vehicleinfo.space.search.axispot;

/** Axispotに格納されているデータが保持する属性情報のキー一覧. */
public enum WeatherAttributes implements StoreDataAttribute {

  /** 空間ID(ズームレベル15相当) */
  SPATIAL_ID("spatialId"),
  /** 種別 */
  TYPE("type"),
  /** 気温 */
  TEMPERATURE("temperature"),
  /** 降水量 */
  PRECIPITATION("precipitation"),
  /** 湿度 */
  HUMIDITY("humidity"),
  /** 天気 */
  WEATHER_FORECAST("weatherForecast"),
  /** 風向 */
  WIND_DIRECTION("windDirection"),
  /** 風速 */
  WIND_SPEED("windSpeed"),
  /** 更新日時 */
  UPDATED_AT("updatedAt");

  private final String key;

  WeatherAttributes(String key) {
    this.key = key;
  }

  public String getKey() {
    return key;
  }
}
