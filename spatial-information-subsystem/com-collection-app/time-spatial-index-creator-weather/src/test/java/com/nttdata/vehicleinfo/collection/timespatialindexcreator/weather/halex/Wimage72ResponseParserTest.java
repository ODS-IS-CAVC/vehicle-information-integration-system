package com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.halex;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.WeatherInformation;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.test.Wimage72ResponseTestHelper;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class Wimage72ResponseParserTest {

  /** 欠測データ */
  private final String MISSING_VALUE = "65535.0";

  /** JST */
  private final ZoneId JST = ZoneId.of("Asia/Tokyo");

  /** UTC */
  private final ZoneId UTC = ZoneId.of("UTC");

  @Test
  void constructor_NG() {
    // nullの場合はIllegalArgumentExceptionが発生すること
    assertThrows(IllegalArgumentException.class, () -> new Wimage72ResponseParser(null, UTC, UTC));
    // 存在しないファイルの場合はIllegalArgumentExceptionが発生すること
    assertThrows(
        IllegalArgumentException.class,
        () -> new Wimage72ResponseParser(Path.of("NOT_EXISTS"), UTC, UTC));
    // ファイルではない場合はIllegalArgumentExceptionが発生すること
    assertThrows(
        IllegalArgumentException.class, () -> new Wimage72ResponseParser(Path.of(""), UTC, UTC));
  }

  @Test
  void toWeatherInformationList() {
    Wimage72ResponseParser res0000 = Wimage72ResponseTestHelper.get202409040000(JST, UTC);
    List<WeatherInformation> list0000 = res0000.toWeatherInformationList(0);
    // 73件（actual=1件, forecast=72件）
    assertEquals(73, list0000.size());

    Wimage72ResponseParser res2300 = Wimage72ResponseTestHelper.get202409042300(JST, UTC);
    List<WeatherInformation> list2300 = res2300.toWeatherInformationList(0);
    // 50件（actual=1件, forecast=49件）
    assertEquals(50, list2300.size());

    Wimage72ResponseParser resCopy = Wimage72ResponseTestHelper.get202409040000(JST, UTC);
    List<WeatherInformation> listCopy = resCopy.toWeatherInformationList(10);
    // 313件（actual=1件, forecast=72件, copy=240件）
    assertEquals(313, listCopy.size());
  }

  @Test
  void getActualTemperature() {
    // 0時台の気温の実況値は欠測データであること
    assertEquals(
        MISSING_VALUE, Wimage72ResponseTestHelper.get202409040000(JST, UTC).getActualTemperature());
    // 0時台以外（23時台)は対象日時の気温の実況値が取得できること
    assertEquals(
        "99.9", Wimage72ResponseTestHelper.get202409042300(JST, UTC).getActualTemperature());
  }

  @Test
  void getActualPrecipitation() {
    // 0時台の気温の実況値は欠測データであること
    assertEquals(
        MISSING_VALUE,
        Wimage72ResponseTestHelper.get202409040000(JST, UTC).getActualPrecipitation());
    // 0時台以外（23時台)は対象日時の気温の実況値が取得できること
    assertEquals(
        "99.9", Wimage72ResponseTestHelper.get202409042300(JST, UTC).getActualPrecipitation());
  }

  @Test
  void getForecastInfosAll() {
    // 0時台は72時間先までの予測データが取得できること
    assertEquals(
        72, Wimage72ResponseTestHelper.get202409040000(JST, UTC).getForecastInfosAll().size());
    // 23時台は49時間先までの予測データが取得できること
    assertEquals(
        49, Wimage72ResponseTestHelper.get202409042300(JST, UTC).getForecastInfosAll().size());
  }

  @Test
  void getForecastInfos() {
    // 指定した予報日時の気象情報が取得できること
    Map<String, Object> forecastInfos =
        Wimage72ResponseTestHelper.get202409040000(JST, UTC).getForecastInfos("202409040100");
    assertEquals("93.7", forecastInfos.get("humidity"));
    assertEquals("22.7", forecastInfos.get("temperature"));
    assertEquals("200", forecastInfos.get("weatherForecast"));
    assertEquals("342.8", forecastInfos.get("windDirection"));
    assertEquals("1.4", forecastInfos.get("windSpeed"));

    // 指定した予報日時の気象情報が存在しない場合は空のMapが取得できること
    Map<String, Object> nothing =
        Wimage72ResponseTestHelper.get202409040000(JST, UTC).getForecastInfos("NOTHING");
    assertTrue(nothing.isEmpty());
  }

  @Test
  void getForecastPrecipitaitonAll() {
    // 0時台は72時間先までの予測データが取得できること
    assertEquals(
        72,
        Wimage72ResponseTestHelper.get202409040000(JST, UTC).getForecastPrecipitaitonAll().size());
    // 23時台は49時間先までの予測データが取得できること
    assertEquals(
        49,
        Wimage72ResponseTestHelper.get202409042300(JST, UTC).getForecastPrecipitaitonAll().size());
  }

  @Test
  void getForecastPrecipitaiton() {
    // 指定した予報日時の降水量が存在しない場合は空のListが取得できること
    assertTrue(
        Wimage72ResponseTestHelper.get202409040000(JST, UTC)
            .getForecastPrecipitaiton("NOTHING")
            .isEmpty());
    // 指定した予報日時の降水量が取得できること
    Map<String, Object> forecastPrecipitation =
        Wimage72ResponseTestHelper.get202409040000(JST, UTC)
            .getForecastPrecipitaiton("202409040100");
    assertEquals("202409040000-202409040100", forecastPrecipitation.get("dtf"));
    assertEquals("0.0", forecastPrecipitation.get("value"));
    // 指定した予報日時の降水量が複数件存在する場合はRuntimeException
    RuntimeException exception =
        assertThrows(
            RuntimeException.class,
            () -> {
              Wimage72ResponseTestHelper.get202409040000(JST, UTC).getForecastPrecipitaiton("0100");
            });
    assertEquals("指定した時間の降水量の予測値が複数件存在します: dtfEnd=0100", exception.getMessage());
  }

  @Test
  void parseVersion() {
    // バージョンが取得できること
    assertEquals(
        "202409040000", Wimage72ResponseTestHelper.get202409040000(JST, UTC).parseVersion());

    // バージョンが取得できない場合はUNKNOWNとなること
    Wimage72ResponseParser invalid =
        new Wimage72ResponseParser(
            Wimage72ResponseTestHelper.getResourceAsPath(
                "data/halex-dreamapi/wimage72-service/invalid_verison/202409040000/lat35.73243_lon139.71547.json"),
            UTC,
            JST);
    assertEquals("UNKNOWN", invalid.parseVersion());
  }

  @Test
  void parseSystemTIme() {
    ZonedDateTime expected = ZonedDateTime.parse("2024-09-04T01:00:04.785+09:00[Asia/Tokyo]");
    // systemTimeが取得できること
    assertEquals(expected, Wimage72ResponseTestHelper.get202409040000(JST, UTC).parseSystemTime());

    // systemTimeが取得できない場合は現在日時(dreamApiWimage72ZoneId)が取得できること
    ZoneId dreamApiWimage72ZoneId = JST;
    ZoneId axispotZoneId = UTC;
    ZonedDateTime before = ZonedDateTime.now(dreamApiWimage72ZoneId);
    Wimage72ResponseParser invalid =
        new Wimage72ResponseParser(
            Wimage72ResponseTestHelper.getResourceAsPath(
                "data/halex-dreamapi/wimage72-service/invalid_systemTime/202409040000/lat35.73243_lon139.71547.json"),
            dreamApiWimage72ZoneId,
            axispotZoneId);

    ZonedDateTime actual = invalid.getSystemTime();
    // タイムゾーンがdreamApiWimage72ZoneIdであること
    assertEquals(dreamApiWimage72ZoneId, actual.getZone());
    // 期待値は実行前よりも後であること
    assertTrue(actual.isAfter(before));
  }

  @Test
  void zonedDateTimeToISO8601() {
    // JST 2024年1月2日3時4分が正しくISO8601形式に変換できること
    ZonedDateTime jst202401020304 = ZonedDateTime.of(2024, 1, 2, 3, 4, 0, 0, JST);
    // JST → ISO8601形式JST
    assertEquals(
        "2024-01-02T03:04:00+09:00",
        Wimage72ResponseParser.zonedDateTimeToISO8601(jst202401020304, JST));
    // JST → ISO8601形式UTF
    assertEquals(
        "2024-01-01T18:04:00Z",
        Wimage72ResponseParser.zonedDateTimeToISO8601(jst202401020304, UTC));

    // UTC 2024年1月2日3時4分が正しくISO8601形式に変換できること
    ZonedDateTime utc202401020304 = ZonedDateTime.of(2024, 1, 2, 3, 4, 0, 0, UTC);
    // UTC → ISO8601形式JST
    assertEquals(
        "2024-01-02T12:04:00+09:00",
        Wimage72ResponseParser.zonedDateTimeToISO8601(utc202401020304, JST));
    // UTC → ISO8601形式UTC
    assertEquals(
        "2024-01-02T03:04:00Z",
        Wimage72ResponseParser.zonedDateTimeToISO8601(utc202401020304, UTC));
  }

  @Test
  void initLatLon() {
    Wimage72ResponseParser res = Wimage72ResponseTestHelper.get202409040000(JST, UTC);

    // 正数
    res.initLatLon(Paths.get("lat34.8363499907_lon137.7410888671875.json"));
    assertEquals("34.8363499907", res.getLatitudeStr());
    assertEquals(34.8363499907d, res.getLatitude(), 0.0d);
    assertEquals("137.7410888671875", res.getLongitudeStr());
    assertEquals(137.7410888671875d, res.getLongitude(), 0.0d);

    // 負数
    res.initLatLon(Paths.get("lat-34.8363499907_lon-137.7410888671875.json"));
    assertEquals("-34.8363499907", res.getLatitudeStr());
    assertEquals(-34.8363499907d, res.getLatitude(), 0.0d);
    assertEquals("-137.7410888671875", res.getLongitudeStr());
    assertEquals(-137.7410888671875d, res.getLongitude(), 0.0d);

    // IllegalArgumentException
    IllegalArgumentException exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> {
              res.initLatLon(Paths.get("invalid_file.json"));
            });
    assertEquals("ファイル名から緯度経度の取得失敗: invalid_file.json", exception.getMessage());
  }

  @Test
  void initTargetDateTime() {
    Wimage72ResponseParser res = Wimage72ResponseTestHelper.get202409040000(JST, UTC);

    // 正常
    res.initTargetDateTime(Paths.get("197001010900/test.json"));
    assertEquals("197001010900", res.getFormattedTargetDateTime());
    ZonedDateTime expected197001010900 =
        ZonedDateTime.parse(
            "1970-01-01T09:00+09:00[Asia/Tokyo]", DateTimeFormatter.ISO_ZONED_DATE_TIME);
    assertEquals(expected197001010900, res.getTargetZonedDateTime());

    // IllegalArgumentException
    IllegalArgumentException exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> {
              res.initTargetDateTime(Paths.get("invalid_dir/test.txt"));
            });
    assertEquals("ディレクトリ名から対象日時の取得失敗: invalid_dir/test.txt", exception.getMessage());
  }

  @Test
  void initJson() throws URISyntaxException, IOException {
    // 202409040000で初期化した後に202409042300でinitJson()を呼び出すと上書きされること
    Wimage72ResponseParser res = Wimage72ResponseTestHelper.get202409040000(JST, UTC);
    Path inputFilePath =
        Paths.get(
            getClass()
                .getClassLoader()
                .getResource(
                    "data/halex-dreamapi/wimage72-service/202409042300/lat35.73243_lon139.71547.json")
                .toURI());
    res.initJson(inputFilePath);
    String expectedInputJson = Files.readString(inputFilePath, StandardCharsets.UTF_8);
    Map expectedInputMap = new ObjectMapper().readValue(expectedInputJson, Map.class);
    assertEquals(expectedInputJson, res.getInputJson());
    assertEquals(expectedInputMap, res.getInputMap());
    assertEquals("202409042300", res.getVersion());

    // IllegalArgumentExceptionが発生すること
    IllegalArgumentException exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> {
              res.initJson(Paths.get("invalid_dir/invalid_file.txt"));
            });
    assertEquals("jsonファイルの解析失敗: invalid_dir/invalid_file.txt", exception.getMessage());
  }
}
