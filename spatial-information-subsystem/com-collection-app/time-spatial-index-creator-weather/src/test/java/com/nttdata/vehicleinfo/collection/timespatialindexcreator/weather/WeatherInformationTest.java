package com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather;

import static org.junit.jupiter.api.Assertions.*;

import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class WeatherInformationTest {

  @Test
  void toAttributes() {
    ZonedDateTime time = ZonedDateTime.of(1970, 1, 1, 0, 0, 4, 0, ZoneOffset.UTC);
    ZonedDateTime updatedAt = ZonedDateTime.of(2023, 11, 9, 12, 34, 56, 0, ZoneId.of("Asia/Tokyo"));

    WeatherInformation.Builder builder =
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
            .updatedAt(updatedAt);

    WeatherInformation weatherInformation = builder.build();

    Map<String, String> actual = weatherInformation.toAttributes();

    Map<String, String> expected = new HashMap<>();

    expected.put(WeatherInformation.Attribute.spatialId, "spatialId");
    expected.put(WeatherInformation.Attribute.type, WeatherInformation.Type.Actual.name());
    expected.put(WeatherInformation.Attribute.temperature, "temperature");
    expected.put(WeatherInformation.Attribute.precipitation, "precipitation");
    expected.put(WeatherInformation.Attribute.humidity, "humidity");
    expected.put(WeatherInformation.Attribute.weatherForecast, "weatherForecast");
    expected.put(WeatherInformation.Attribute.windDirection, "windDirection");
    expected.put(WeatherInformation.Attribute.windSpeed, "windSpeed");
    expected.put(WeatherInformation.Attribute.updatedAt, "2023-11-09T12:34:56+09:00");

    assertEquals(expected, actual);

    // updatedAtのタイムゾーンがUTCの場合はISO形式もUTCになっていること
    ZonedDateTime updatedAtUtc = ZonedDateTime.of(2023, 11, 9, 12, 34, 56, 0, ZoneOffset.UTC);
    builder.updatedAt(updatedAtUtc);
    assertEquals(
        "2023-11-09T12:34:56Z",
        builder.build().toAttributes().get(WeatherInformation.Attribute.updatedAt));
  }
}
