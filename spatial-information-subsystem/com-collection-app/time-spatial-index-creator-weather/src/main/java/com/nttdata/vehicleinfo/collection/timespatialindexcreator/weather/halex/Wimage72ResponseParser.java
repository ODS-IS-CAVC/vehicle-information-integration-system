package com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.halex;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nttdata.vehicleinfo.collection.spatialindexcreator.SpatialId;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.WeatherInformation;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.MessageFormat;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** DreamApiの72時間dataのレスポンス解析 */
public class Wimage72ResponseParser {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  static class SpatialIdIllegalArgumentException extends IllegalArgumentException {
    public SpatialIdIllegalArgumentException() {}

    public SpatialIdIllegalArgumentException(String s) {
      super(s);
    }

    public SpatialIdIllegalArgumentException(String message, Throwable cause) {
      super(message, cause);
    }

    public SpatialIdIllegalArgumentException(Throwable cause) {
      super(cause);
    }
  }

  /** JSONのKey */
  static class Key {
    static final String ActualInfos = "ActualInfos";
    static final String ActualPrecipitation = "ActualPrecipitation";
    static final String ForecastInfos = "ForecastInfos";
    static final String ForecastPrecipitaiton = "ForecastPrecipitaiton";
    static final String temperature = "temperature";
    static final String dtf = "dtf";
    static final String value = "value";
    static final String humidity = "humidity";
    static final String weatherForecast = "weatherForecast";
    static final String windDirection = "windDirection";
    static final String windSpeed = "windSpeed";
    static final String systemTime = "systemTime";
  }

  /** 欠測データ */
  private static final String MISSING_VALUE = "65535.0";

  /** 高度 */
  private static final double ALTITUDE = 0.0;

  /** 空間IDのズームレベル */
  private static final int ZOOM_LEVEL = 15;

  /** DreamApiの対象日時形式 */
  private final DateTimeFormatter targetDateTimeFormatter;

  /** DreamApiのsystemTimeの日時形式 */
  private final DateTimeFormatter systemTimeDateTimeFormatter =
      DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss.SSS z");

  private final ZoneId dreamApiWimage72ZoneId;
  private final ZoneId axispotZoneId;
  private String inputJson;
  private String version;
  private String formattedTargetDateTime;
  private ZonedDateTime targetZonedDateTime;
  private String longitudeStr;
  private String latitudeStr;
  private double longitude;
  private double latitude;
  private Map<String, Object> inputMap;
  private ZonedDateTime systemTime;

  /**
   * 指定したファイルパスが正常でレスポンスとして解析できた場合のみ生成する。
   *
   * <ul>
   *   <li>指定した入力ファイルパスがnullではなく存在するファイルであること。
   *   <li>指定した入力ファイルパスの親ディレクトリから対象日時を取得できること。
   *   <li>指定した入力ファイルパスのファイル名から緯度、経度を取得できること。
   *   <li>指定した入力ファイルパスをJSONファイルとして読み込めること。
   * </ul>
   *
   * @param inputFilePath 入力ファイルパス
   * @param axispotZoneId Axispotタイムゾーン
   * @param dreamApiWimage72ZoneId DreamApi72時間dataタイムゾーン
   * @throws IllegalArgumentException 指定した入力ファイルパスが不正な場合
   * @throws IllegalArgumentException レスポンスとして解析できない場合
   */
  public Wimage72ResponseParser(
      Path inputFilePath, ZoneId dreamApiWimage72ZoneId, ZoneId axispotZoneId) {
    if (inputFilePath == null || !Files.exists(inputFilePath) || !inputFilePath.toFile().isFile()) {
      String errMsg = MessageFormat.format("inputFilePathが不正: {0}", inputFilePath);
      throw new IllegalArgumentException(errMsg);
    }

    this.dreamApiWimage72ZoneId = dreamApiWimage72ZoneId;
    this.targetDateTimeFormatter =
        DateTimeFormatter.ofPattern("yyyyMMddHHmm").withZone(getDreamApiWimage72ZoneId());
    this.axispotZoneId = axispotZoneId;

    initLatLon(inputFilePath);
    initTargetDateTime(inputFilePath);
    initJson(inputFilePath);
  }

  /**
   * Axispotタイムゾーンを取得する。
   *
   * @return Axispotタイムゾーン
   */
  public ZoneId getAxispotZoneId() {
    return axispotZoneId;
  }

  /**
   * DreamApi72時間dataタイムゾーンを取得する。
   *
   * @return DreamApi72時間dataタイムゾーン
   */
  public ZoneId getDreamApiWimage72ZoneId() {
    return dreamApiWimage72ZoneId;
  }

  /**
   * DreamApiの対象日時形式を取得する。
   *
   * @return DreamApiの対象日時形式
   */
  public DateTimeFormatter getTargetDateTimeFormatter() {
    return targetDateTimeFormatter;
  }

  /**
   * 入力ファイルの文字列（JSON）を取得する。
   *
   * @return 文字列（JSON）
   */
  public String getInputJson() {
    return inputJson;
  }

  /**
   * バージョンを取得する。
   *
   * @return バージョン
   */
  public String getVersion() {
    return version;
  }

  /**
   * 親ディレクトリ名から取得したフォーマット済み対象日時（yyyyMMddHHmm）を取得する。
   *
   * @return フォーマット済み対象日時（yyyyMMddHHmm）
   */
  public String getFormattedTargetDateTime() {
    return formattedTargetDateTime;
  }

  /**
   * ZonedDateTimeの対象日時を取得する。
   *
   * @return ZonedDateTimeの対象日時
   */
  public ZonedDateTime getTargetZonedDateTime() {
    return targetZonedDateTime;
  }

  /**
   * 文字列の経度を取得する。
   *
   * @return 文字列の経度
   */
  public String getLongitudeStr() {
    return longitudeStr;
  }

  /**
   * 文字列の緯度を取得する。
   *
   * @return 文字列の緯度
   */
  public String getLatitudeStr() {
    return latitudeStr;
  }

  /**
   * 経度を取得する。
   *
   * @return 経度
   */
  public double getLongitude() {
    return longitude;
  }

  /**
   * 緯度を取得する。
   *
   * @return 緯度
   */
  public double getLatitude() {
    return latitude;
  }

  /**
   * 入力ファイルのJSONから変換したMapを取得する。
   *
   * @return Map
   */
  public Map<String, Object> getInputMap() {
    return inputMap;
  }

  /**
   * systemTimeを取得する。
   *
   * @return systemTime
   */
  public ZonedDateTime getSystemTime() {
    return systemTime;
  }

  /**
   * 指定したコピー日数分のコピーを持つ気象情報リスト（実況、予測、コピー）に変換する。
   *
   * @param copyForecastDays コピー日数
   * @return 気象情報リスト（実況、予測、コピー）
   */
  public List<WeatherInformation> toWeatherInformationList(int copyForecastDays) {
    try {
      List<WeatherInformation> resultList = new ArrayList<>();
      // 実況
      WeatherInformation actual = getActual(this);
      logger.debug("actual : count=1");
      resultList.add(actual);
      // 予測
      List<WeatherInformation> forecast = getForecast(this);
      logger.debug("forecast : count={}", forecast.size());
      resultList.addAll(forecast);
      // コピー
      List<WeatherInformation> copy = getCopy(forecast.getLast(), copyForecastDays);
      logger.debug("copy : count={}", copy.size());
      resultList.addAll(copy);
      logger.debug("total : count={}", resultList.size());
      return resultList;
    } catch (SpatialIdIllegalArgumentException e) {
      logger.warn(
          "空間IDが生成できないデータのため変換をスキップ: latitude={}, longitude={}",
          getLatitudeStr(),
          getLongitudeStr(),
          e);
      return Collections.emptyList();
    }
  }

  static WeatherInformation getActual(Wimage72ResponseParser res) {
    return WeatherInformation.builder()
        .id(zonedDateTimeToISO8601(res.getTargetZonedDateTime(), res.getAxispotZoneId()))
        .latitude(res.getLatitude())
        .longitude(res.getLongitude())
        .altitude(ALTITUDE)
        .time(res.getTargetZonedDateTime().withZoneSameInstant(res.getAxispotZoneId()))
        .spatialId(res.getSpatialId(ZOOM_LEVEL))
        .type(WeatherInformation.Type.Actual)
        .temperature(res.getActualTemperature())
        .precipitation(res.getActualPrecipitation())
        .humidity(MISSING_VALUE)
        .weatherForecast(MISSING_VALUE)
        .windDirection(MISSING_VALUE)
        .windSpeed(MISSING_VALUE)
        .updatedAt(res.getSystemTime())
        .build();
  }

  static List<WeatherInformation> getForecast(Wimage72ResponseParser res) {
    List<WeatherInformation> resultList = new ArrayList<>();
    // 対象日時
    ZonedDateTime target = res.getTargetZonedDateTime();
    // 予測は日単位で3日先まで(min=1時間先、max=49時間先or72時間先）
    ZonedDateTime start = target.plusHours(1);
    // isBefore()で判定するため+1秒しておく
    ZonedDateTime end = target.withHour(0).plusDays(3).plusSeconds(1);
    // 1時間ずつ増やして処理
    for (ZonedDateTime forecastZonedDateTime = start;
        forecastZonedDateTime.isBefore(end);
        forecastZonedDateTime = forecastZonedDateTime.plusHours(1)) {

      // 予報を1件取得する
      String key = res.getTargetDateTimeFormatter().format(forecastZonedDateTime);
      Map<String, Object> forecastInfos = res.getForecastInfos(key);
      Map<String, Object> forecastPrecipitaiton = res.getForecastPrecipitaiton(key);

      WeatherInformation forecast =
          WeatherInformation.builder()
              .id(zonedDateTimeToISO8601(forecastZonedDateTime, res.getAxispotZoneId()))
              .latitude(res.getLatitude())
              .longitude(res.getLongitude())
              .altitude(ALTITUDE)
              .time(forecastZonedDateTime.withZoneSameInstant(res.getAxispotZoneId()))
              .spatialId(res.getSpatialId(ZOOM_LEVEL))
              .type(WeatherInformation.Type.Forecast)
              .temperature((String) forecastInfos.getOrDefault(Key.temperature, MISSING_VALUE))
              .precipitation((String) forecastPrecipitaiton.getOrDefault(Key.value, MISSING_VALUE))
              .humidity((String) forecastInfos.getOrDefault(Key.humidity, MISSING_VALUE))
              .weatherForecast(
                  (String) forecastInfos.getOrDefault(Key.weatherForecast, MISSING_VALUE))
              .windDirection((String) forecastInfos.getOrDefault(Key.windDirection, MISSING_VALUE))
              .windSpeed((String) forecastInfos.getOrDefault(Key.windSpeed, MISSING_VALUE))
              .updatedAt(res.getSystemTime())
              .build();
      resultList.add(forecast);
    }
    return resultList;
  }

  static List<WeatherInformation> getCopy(WeatherInformation lastForecast, int copyForecastDays) {
    List<WeatherInformation> resultList = new ArrayList<>();
    // コピーは最も未来の予測日時の1時間後から開始
    // 例）予測日時が2024-09-07T00:00+09:00[Asia/Tokyo]の場合
    // start : 2024-09-07T01:00+09:00[Asia/Tokyo]
    // 例）copyForecastDaysが11の場合
    // end   : 2024-09-18T01:00+09:00[Asia/Tokyo]
    ZonedDateTime start = lastForecast.getTime().plusHours(1);
    ZonedDateTime end = start.plusDays(copyForecastDays);

    for (ZonedDateTime copyZonedDateTime = start;
        copyZonedDateTime.isBefore(end);
        copyZonedDateTime = copyZonedDateTime.plusHours(1)) {

      WeatherInformation copy =
          lastForecast.toBuilder()
              .id(copyZonedDateTime.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
              .time(copyZonedDateTime)
              .type(WeatherInformation.Type.Copy)
              .build();
      resultList.add(copy);
    }
    return resultList;
  }

  /**
   * 実況値の気温を返す。
   *
   * <p>temperatureが取得できない場合は欠測データを返す。
   *
   * @return 実況値の気温
   */
  String getActualTemperature() {
    /*   {"ActualInfos":
     *     {"202409030100":
     *       {"temperature":"26.5"},
     *      "202409030200":
     *       {"temperature":"26.2"}
     *     },
     *     …
     *   }
     */
    // 気温が取得できない場合は欠測データを返す
    Map<String, Object> actualInfos =
        (Map<String, Object>) this.inputMap.getOrDefault(Key.ActualInfos, Collections.emptyMap());
    Map<String, String> record =
        (Map<String, String>)
            actualInfos.getOrDefault(formattedTargetDateTime, Collections.emptyMap());
    return record.getOrDefault(Key.temperature, MISSING_VALUE);
  }

  /**
   * 実況値の降水量を返す。
   *
   * <p>0時台のデータは欠測データを返す。
   *
   * <p>valueが取得できない場合は欠測データを返す。
   *
   * @return 実況値の降水量
   */
  String getActualPrecipitation() {
    List<Map<String, Object>> list =
        (List<Map<String, Object>>) this.inputMap.get(Key.ActualPrecipitation);
    if (list.isEmpty()) {
      // 0時台は0件のため欠損データを返す
      return MISSING_VALUE;
    } else {
      // 1時台～23時台はvalueの値を返す
      // valueが取得できない場合は欠測データを返す
      Map<String, Object> element = list.getLast();
      String temperature = (String) element.getOrDefault(Key.value, MISSING_VALUE);
      return temperature;
    }
  }

  /**
   * 気象情報の予測値をすべて取得する。
   *
   * @return 気象情報の予測値のMap
   */
  Map<String, Object> getForecastInfosAll() {
    return (Map<String, Object>)
        this.inputMap.getOrDefault(Key.ForecastInfos, Collections.emptyMap());
  }

  /**
   * 降水量の予測値をすべて取得する。
   *
   * @return 降水量の予測値のList
   */
  List<Map<String, Object>> getForecastPrecipitaitonAll() {
    return (List<Map<String, Object>>)
        this.inputMap.getOrDefault(Key.ForecastPrecipitaiton, Collections.emptyList());
  }

  /**
   * 指定したズームレベルに対応するZFXY形式の空間IDを取得する。
   *
   * @param zoomLevel ズームレベル
   * @return ZFXY形式の空間ID
   */
  public String getSpatialId(int zoomLevel) {
    try {
      return new SpatialId(zoomLevel, ALTITUDE, getLongitude(), getLatitude()).formatToZfxy();
    } catch (IllegalArgumentException e) {
      throw new SpatialIdIllegalArgumentException(e);
    }
  }

  /**
   * 指定した時間の降水量の予測値を1件取得する。
   *
   * @param dtfEnd 予報期間の終了
   * @return 指定した時間の降水量の予測値
   */
  public Map<String, Object> getForecastPrecipitaiton(String dtfEnd) {
    List<Map<String, Object>> list =
        this.getForecastPrecipitaitonAll().stream()
            .filter(o -> o.getOrDefault(Key.dtf, "").toString().endsWith(dtfEnd))
            .collect(Collectors.toList());
    if (list.isEmpty()) {
      return Collections.emptyMap();
    } else if (list.size() == 1) {
      return list.getFirst();
    } else {
      String errMsg = MessageFormat.format("指定した時間の降水量の予測値が複数件存在します: dtfEnd={0}", dtfEnd);
      throw new RuntimeException(errMsg);
    }
  }

  /**
   * 指定した予報日時で気象情報を1件取得する。
   *
   * @param key 予報日時
   * @return 指定した予報日時の気象情報
   */
  public Map<String, Object> getForecastInfos(String key) {
    return (Map<String, Object>)
        this.getForecastInfosAll().getOrDefault(key, Collections.emptyMap());
  }

  String parseVersion() {
    try {
      // ForecastPrecipitaitonの1件目のdtfの開始をバージョンとする
      // 以下、理由。
      // ・必ず1件目にデータが入っている
      // ・実行日時の年月日時00分と一致する
      String dtf = (String) getForecastPrecipitaitonAll().getFirst().get(Key.dtf);
      return dtf.split("-")[0];
    } catch (Exception e) {
      String msg =
          MessageFormat.format("ForecastPrecipitaitonの1件目のdtfの開始の取得失敗: inputJson={0}", inputJson);
      logger.warn(msg, e);
      // 処理は続行する
      return "UNKNOWN";
    }
  }

  ZonedDateTime parseSystemTime() {
    try {
      // systemTimeを取得する
      String systemTime = (String) inputMap.get(Key.systemTime);
      return ZonedDateTime.parse(systemTime, systemTimeDateTimeFormatter)
          .withZoneSameInstant(dreamApiWimage72ZoneId);
    } catch (Exception e) {
      String msg = MessageFormat.format("systemTimeの解析失敗: inputJson={0}", inputJson);
      logger.warn(msg, e);
      // 現在日時を返して処理を続行する
      return ZonedDateTime.now(getDreamApiWimage72ZoneId());
    }
  }

  static String zonedDateTimeToISO8601(ZonedDateTime zonedDateTime, ZoneId toZoneId) {
    // 例：2023-04-01T21:45:30Z
    ZonedDateTime iso = zonedDateTime.withZoneSameInstant(toZoneId);
    return iso.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
  }

  void initLatLon(Path inputFilePath) {
    try {
      // ファイル名から緯度経度を取り出す
      // 例) lat34.8363499907_lon137.7410888671875.json
      String fileName = inputFilePath.getFileName().toString();
      String[] latlon =
          fileName.replace("lat", "").replace("lon", "").replace(".json", "").split("_");
      this.latitudeStr = latlon[0];
      this.longitudeStr = latlon[1];
      this.latitude = Double.parseDouble(latitudeStr);
      this.longitude = Double.parseDouble(longitudeStr);
    } catch (Exception e) {
      throw new IllegalArgumentException("ファイル名から緯度経度の取得失敗: " + inputFilePath, e);
    }
  }

  void initTargetDateTime(Path inputFilePath) {
    try {
      // ディレクトリ名からフォーマット済み対象日時を取得
      // 例) 202409211500
      this.formattedTargetDateTime = inputFilePath.getParent().getFileName().toString();
      // フォーマット済み対象日時をZonedDateTimeに変換
      this.targetZonedDateTime =
          ZonedDateTime.parse(this.formattedTargetDateTime, this.targetDateTimeFormatter);
    } catch (Exception e) {
      throw new IllegalArgumentException("ディレクトリ名から対象日時の取得失敗: " + inputFilePath, e);
    }
  }

  void initJson(Path inputFilePath) {
    try {
      this.inputJson = Files.readString(inputFilePath, StandardCharsets.UTF_8);
      ObjectMapper objectMapper = new ObjectMapper();
      this.inputMap = objectMapper.readValue(inputJson, Map.class);
      this.version = parseVersion();
      this.systemTime = parseSystemTime();
    } catch (Exception e) {
      throw new IllegalArgumentException("jsonファイルの解析失敗: " + inputFilePath, e);
    }
  }
}
