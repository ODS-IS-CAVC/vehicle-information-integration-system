package com.nttdata.vehicleinfo.space.search.controller;

import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;

import com.nttdata.vehicleinfo.space.search.api.WeathersApi;
import com.nttdata.vehicleinfo.space.search.axispot.SpatialId;
import com.nttdata.vehicleinfo.space.search.axispot.WeatherAttributes;
import com.nttdata.vehicleinfo.space.search.model.WeatherDateTimeDetail;
import com.nttdata.vehicleinfo.space.search.model.WeatherForecast;
import com.nttdata.vehicleinfo.space.search.model.WeatherInfo;
import com.nttdata.vehicleinfo.space.search.model.WeatherSpaceDetail;
import com.nttdata.vehicleinfo.space.search.service.ApiService;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import jp.co.ntt.sic.MovingObjectStoreData;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 気象情報を検索するControllerクラス.<br>
 * インターフェースはOpenAPI Generatorにより自動生成されたものを継承する.
 */
@RestController
@RequestMapping("/cav/api/space/v1")
public class WeathersApiController implements WeathersApi {

  private final ApiService apiService;

  public WeathersApiController(@Qualifier("weathersApiService") ApiService apiService) {
    this.apiService = apiService;
  }

  /**
   * 指定された日時範囲内および空間IDリストに含まれる気象情報を返却します. 検索結果はリクエストされた空間IDリスト、日時順にソートされます.
   *
   * @param targetStartDateTime (required) 検索開始時刻
   * @param targetEndDateTime (required) 検索終了時刻
   * @param spatialID (required) 空間IDリスト
   * @return 検索結果を含んだレスポンス
   */
  @Override
  public ResponseEntity<WeatherInfo> searchWeathers(
      OffsetDateTime targetStartDateTime,
      OffsetDateTime targetEndDateTime,
      List<String> spatialID) {

    WeatherInfo weatherInfo = new WeatherInfo();
    for (String spatialStr : spatialID) {
      SpatialId spatial = SpatialId.parse(spatialStr);
      List<MovingObjectStoreData> results =
          apiService.searchObjects(targetStartDateTime, targetEndDateTime, spatial);
      // createdAtでソートする
      // spatialIDはリクエストされた順を維持する
      results =
          results.stream()
              .sorted(Comparator.comparing(MovingObjectStoreData::getCreatedAt))
              .toList();
      // convert dto
      for (MovingObjectStoreData object : results) {
        // TODO ZoneOffsetは9時間固定とする(ここの値はプロパティ化を検討する)
        weatherInfo.addDatetimesItem(convertEntity(object, ZoneOffset.ofHours(9)));
      }
    }
    return new ResponseEntity<>(weatherInfo, HttpStatus.OK);
  }

  private static WeatherDateTimeDetail convertEntity(
      MovingObjectStoreData object, ZoneOffset offset) {
    WeatherSpaceDetail space = new WeatherSpaceDetail();
    space.setSpatialID(object.getAttributes().get(WeatherAttributes.SPATIAL_ID.getKey()));
    // getCoordにはlon, lat, altの順で格納されている
    space.setLon(object.getCoord().x);
    space.setLat(object.getCoord().y);
    space.setHumidity(
        Double.parseDouble(object.getAttributes().get(WeatherAttributes.HUMIDITY.getKey())));
    space.setTemperature(
        Double.parseDouble(object.getAttributes().get(WeatherAttributes.TEMPERATURE.getKey())));
    space.setWeatherForecast(
        WeatherForecast.fromValue(
            object.getAttributes().get(WeatherAttributes.WEATHER_FORECAST.getKey())));
    space.setWindDirection(
        Double.parseDouble(object.getAttributes().get(WeatherAttributes.WIND_DIRECTION.getKey())));
    space.setWindSpeed(
        Double.parseDouble(object.getAttributes().get(WeatherAttributes.WIND_SPEED.getKey())));
    space.setPrecipitation(
        Double.parseDouble(object.getAttributes().get(WeatherAttributes.PRECIPITATION.getKey())));
    space.setUpdatedAt(
        OffsetDateTime.parse(
            object.getAttributes().get(WeatherAttributes.UPDATED_AT.getKey()),
            ISO_OFFSET_DATE_TIME));

    WeatherDateTimeDetail dateTime = new WeatherDateTimeDetail();
    dateTime.setDateTime(OffsetDateTime.ofInstant(object.getCreatedAt().toInstant(), offset));
    dateTime.setWeathers(space);
    return dateTime;
  }
}
