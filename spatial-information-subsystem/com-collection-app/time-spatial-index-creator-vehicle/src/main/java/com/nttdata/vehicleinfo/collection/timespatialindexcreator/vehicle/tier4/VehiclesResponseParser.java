package com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.tier4;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nttdata.vehicleinfo.collection.spatialindexcreator.SpatialId;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.VehicleInformation;
import java.lang.invoke.MethodHandles;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.MessageFormat;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** DigitalZensoAPIのviecles（自動運転車両モデルの全データ取得）のレスポンス解析 */
public class VehiclesResponseParser {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  /** JSONのKey */
  static class Key {
    static final String dataModelType = "dataModelType";
    static final String attribute = "attribute";
    static final String vehicleId = "vehicleId";
    static final String vehicleName = "vehicleName";
    static final String status = "status";
    static final String location = "location";
    static final String lat = "lat";
    static final String lng = "lng";
    static final String height = "height";
    static final String updatedAt = "updatedAt";
  }

  /** 空間IDのズームレベル */
  private static final int ZOOM_LEVEL = 25;

  private final ZoneId digitalZensoApiZoneId;
  private final ZoneId axispotZoneId;
  private String inputJson;
  private Map<String, Object> inputMap;

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
   * @param digitalZensoApiZoneId DigitalZensoApiタイムゾーン
   * @param axispotZoneId Axispotタイムゾーン
   * @throws IllegalArgumentException 指定した入力ファイルパスが不正な場合
   * @throws IllegalArgumentException レスポンスとして解析できない場合
   */
  // NOTE: btkitamurats digitalZensoApiZoneIdは不要かもしれない(updatedAtがオフセットを持っているため）
  public VehiclesResponseParser(
      Path inputFilePath, ZoneId digitalZensoApiZoneId, ZoneId axispotZoneId) {
    if (inputFilePath == null || !Files.exists(inputFilePath) || !inputFilePath.toFile().isFile()) {
      String errMsg = MessageFormat.format("inputFilePathが不正: {0}", inputFilePath);
      throw new IllegalArgumentException(errMsg);
    }
    this.digitalZensoApiZoneId = digitalZensoApiZoneId;
    this.axispotZoneId = axispotZoneId;
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
   * DigitalZensoApiタイムゾーンを取得する。
   *
   * @return DigitalZensoApiタイムゾーン
   */
  public ZoneId getDigitalZensoApiZoneId() {
    return digitalZensoApiZoneId;
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
   * 入力ファイルのJSONから変換したMapを取得する。
   *
   * @return Map
   */
  public Map<String, Object> getInputMap() {
    return inputMap;
  }

  /**
   * 車両情報リストに変換する。
   *
   * <p>レスポンスをAxispotの時空間データに格納しやすいように変換する。
   *
   * <ul>
   *   <li>複数の情報を保持しているため1件ずつに分解する。
   *   <li>レスポンスは階層構造を持つがフラットな構造にする。
   * </ul>
   *
   * @return 車両情報リスト
   */
  public List<VehicleInformation> toVehicleInformationList() {
    List<VehicleInformation> resultList = new ArrayList<>();
    /* JSONサンプル
    {
      "dataModelType": "test1",
      "attribute": [
        {
          "vehicleId": "78aa302c-1600-44b3-a331-e4659c0b28a1",
          "vehicleName": "vehicle1",
          "status": "driving",
          "location": {
            "lat": 35.6242681254456,
            "lng": 139.74258640456,
            "height": 0.01258640981
          },
          "updatedAt": "2014-10-10T04:50:40.000001+00:00"
        }
      ]
    }
    */
    String dataModelType = (String) this.inputMap.get(Key.dataModelType);
    List<Map<String, Object>> attribute =
        (List<Map<String, Object>>) this.inputMap.get(Key.attribute);
    for (Map<String, Object> viecle : attribute) {
      // vehicleIdが任意項目のため存在しない場合は、AxispotのMovingObjectIdに"-"を設定しておく
      String id = (String) viecle.getOrDefault(Key.vehicleId, "-");
      Map<String, Double> location = (Map<String, Double>) viecle.get(Key.location);
      logger.debug("location: {}", location);
      double longitude = location.get(Key.lng);
      double latitude = location.get(Key.lat);
      double altitude = location.get(Key.height);
      // timeに設定するエポック秒をupdatedAtから算出する（updatedAtはISO8601形式を想定）
      long updateAtEpochSecond;
      try {
        updateAtEpochSecond =
            ZonedDateTime.parse(
                    (String) viecle.get(Key.updatedAt), DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                .withZoneSameInstant(getAxispotZoneId())
                .toEpochSecond();
      } catch (Exception e) {
        // updatedAtの解析に失敗した場合は警告ログを出力してスキップ
        logger.warn("updatedAtの解析に失敗したため変換をスキップ: id={}", id, e);
        continue;
      }

      Optional<String> vehicleId = Optional.ofNullable((String) viecle.get(Key.vehicleId));
      Optional<String> vehicleName = Optional.ofNullable((String) viecle.get(Key.vehicleName));
      Optional<String> status = Optional.ofNullable((String) viecle.get(Key.status));
      String lat = BigDecimal.valueOf(location.get(Key.lat)).toPlainString();
      String lng = BigDecimal.valueOf(location.get(Key.lng)).toPlainString();
      String height = BigDecimal.valueOf(location.get(Key.height)).toPlainString();
      Optional<String> updatedAt = Optional.ofNullable((String) viecle.get(Key.updatedAt));

      // 空間IDを生成
      String spatialId = null;
      try {
        spatialId = new SpatialId(ZOOM_LEVEL, altitude, longitude, latitude).formatToZfxy();
      } catch (IllegalArgumentException e) {
        logger.warn("空間IDが生成できないデータのため変換をスキップ: vehicleId={}", vehicleId, e);
        continue;
      }

      VehicleInformation info =
          new VehicleInformation(
              getAxispotZoneId(),
              id,
              longitude,
              latitude,
              altitude,
              updateAtEpochSecond,
              spatialId,
              dataModelType,
              vehicleId,
              vehicleName,
              status,
              lat,
              lng,
              height,
              updatedAt);

      resultList.add(info);
    }
    logger.debug("total : count={}", resultList.size());
    return resultList;
  }

  void initJson(Path inputFilePath) {
    try {
      this.inputJson = Files.readString(inputFilePath, StandardCharsets.UTF_8);
      ObjectMapper objectMapper = new ObjectMapper();
      this.inputMap = objectMapper.readValue(inputJson, Map.class);
    } catch (Exception e) {
      throw new IllegalArgumentException("jsonファイルの解析失敗: " + inputFilePath, e);
    }
  }
}
