package com.nttdata.vehicleinfo.space.search;

import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;

import com.nttdata.vehicleinfo.space.search.axispot.WeatherAttributes;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.Map;
import jp.co.ntt.sic.Geotemp;
import jp.co.ntt.sic.MovingObjectKey;
import jp.co.ntt.sic.MovingObjectRawData;
import jp.co.ntt.sic.MovingObjectValue;
import org.locationtech.jts.geom.Coordinate;

public class TestUtils {

  // 予測値データの登録
  public static void setActualDataToWeather(
      Geotemp geotemp,
      String spatialId,
      OffsetDateTime time,
      double longitude,
      double latitude,
      double altitude,
      double temperature,
      double precipitation,
      OffsetDateTime updatedAt) {
    MovingObjectKey key =
        new MovingObjectKey(time.toEpochSecond(), longitude, latitude, altitude, "testdata");
    // 気温と降水量以外はデータ不備を表す`65535.0`を設定する
    MovingObjectValue value =
        new MovingObjectValue(
            new Coordinate(longitude, latitude, altitude),
            Timestamp.from(time.toInstant()),
            Map.of(
                WeatherAttributes.SPATIAL_ID.getKey(), spatialId,
                WeatherAttributes.UPDATED_AT.getKey(), ISO_OFFSET_DATE_TIME.format(updatedAt),
                WeatherAttributes.TEMPERATURE.getKey(), String.valueOf(temperature),
                WeatherAttributes.PRECIPITATION.getKey(), String.valueOf(precipitation),
                WeatherAttributes.HUMIDITY.getKey(), "65535.0",
                WeatherAttributes.WEATHER_FORECAST.getKey(), "65535.0",
                WeatherAttributes.WIND_DIRECTION.getKey(), "65535.0",
                WeatherAttributes.WIND_SPEED.getKey(), "65535.0",
                WeatherAttributes.TYPE.getKey(), "actual"));
    MovingObjectRawData data = new MovingObjectRawData(key, value);
    geotemp.set(data);
  }

  public static void setDataToWeather(
      Geotemp geotemp,
      String spatialId,
      OffsetDateTime time,
      double longitude,
      double latitude,
      double altitude,
      OffsetDateTime updatedAt) {
    MovingObjectKey key =
        new MovingObjectKey(time.toEpochSecond(), longitude, latitude, altitude, "testdata");
    // spatialIdとupdatedAt以外はダミー値を入力
    MovingObjectValue value =
        new MovingObjectValue(
            new Coordinate(longitude, latitude, altitude),
            Timestamp.from(time.toInstant()),
            Map.of(
                WeatherAttributes.SPATIAL_ID.getKey(), spatialId,
                WeatherAttributes.UPDATED_AT.getKey(), ISO_OFFSET_DATE_TIME.format(updatedAt),
                WeatherAttributes.TEMPERATURE.getKey(), "30.0",
                WeatherAttributes.PRECIPITATION.getKey(), "10.0",
                WeatherAttributes.HUMIDITY.getKey(), "50.0",
                WeatherAttributes.WEATHER_FORECAST.getKey(), "100",
                WeatherAttributes.WIND_DIRECTION.getKey(), "180.0",
                WeatherAttributes.WIND_SPEED.getKey(), "10.0",
                WeatherAttributes.TYPE.getKey(), "forecast"));
    MovingObjectRawData data = new MovingObjectRawData(key, value);
    geotemp.set(data);
  }
}
