package com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.tier4;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nttdata.vehicleinfo.collection.spatialindexcreator.SpatialId;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.TargetInformation;
import java.lang.invoke.MethodHandles;
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

/** TargetInfoAPIのtargetInfoのレスポンス解析 */
public class TargetInfoResponseParser {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  /** JSONのKey */
  static class Key {
    static final String dataModelType = "dataModelType";
    static final String attribute = "attribute";
    static final String serviceLocationID = "serviceLocationID";
    static final String roadsideUnitID = "roadsideUnitID";
    static final String updateTimeInfo = "updateTimeInfo";
    static final String formatVersion = "formatVersion";
    static final String deviceNum = "deviceNum";
    static final String deviceIndividualInfo = "deviceIndividualInfo";
    static final String deviceID = "deviceID";
    static final String targetNum = "targetNum";
    static final String targetIndividualInfo = "targetIndividualInfo";
    static final String commonServiceStandardID = "commonServiceStandardID";
    static final String targetMessageID = "targetMessageID";
    static final String targetIndividualVersionInfo = "targetIndividualVersionInfo";
    static final String targetID = "targetID";
    static final String targetIndividualIncrementCounter = "targetIndividualIncrementCounter";
    static final String dataLength = "dataLength";
    static final String individualOptionFlag = "individualOptionFlag";
    static final String leapSecondCorrectionInfo = "leapSecondCorrectionInfo";
    static final String time = "time";
    static final String latitude = "latitude";
    static final String longitude = "longitude";
    static final String elevation = "elevation";
    static final String positionConf = "positionConf";
    static final String elevationConf = "elevationConf";
    static final String speed = "speed";
    static final String heading = "heading";
    static final String acceleration = "acceleration";
    static final String speedConf = "speedConf";
    static final String headingConf = "headingConf";
    static final String forwardRearAccelerationConf = "forwardRearAccelerationConf";
    static final String transmissionState = "transmissionState";
    static final String steeringWheelAngle = "steeringWheelAngle";
    static final String sizeClassification = "sizeClassification";
    static final String roleClassification = "roleClassification";
    static final String vehicleWidth = "vehicleWidth";
    static final String vehicleLength = "vehicleLength";
    static final String positionDelay = "positionDelay";
    static final String revisionCounter = "revisionCounter";
    static final String roadFacilities = "roadFacilities";
    static final String roadClassification = "roadClassification";
    static final String semiMajorAxisOfPositionalErrorEllipse =
        "semiMajorAxisOfPositionalErrorEllipse";
    static final String semiMinorAxisOfPositionalErrorEllipse =
        "semiMinorAxisOfPositionalErrorEllipse";
    static final String semiMajorAxisOrientationOfPositionalErrorEllipse =
        "semiMajorAxisOrientationOfPositionalErrorEllipse";
    static final String GPSPositioningMode = "GPSPositioningMode";
    static final String GPSPDOP = "GPSPDOP";
    static final String numberOfGPSSatellitesInUse = "numberOfGPSSatellitesInUse";
    static final String GPSMultiPathDetection = "GPSMultiPathDetection";
    static final String deadReckoningAvailability = "deadReckoningAvailability";
    static final String mapMatchingAvailability = "mapMatchingAvailability";
    static final String yawRate = "yawRate";
    static final String brakeAppliedStatus = "brakeAppliedStatus";
    static final String auxiliaryBrakeAppliedStatus = "auxiliaryBrakeAppliedStatus";
    static final String throttlePosition = "throttlePosition";
    static final String exteriorLights = "exteriorLights";
    static final String adaptiveCruiseControlStatus = "adaptiveCruiseControlStatus";
    static final String cooperativeAdaptiveCruiseControlStatus =
        "cooperativeAdaptiveCruiseControlStatus";
    static final String preCrashSafetyStatus = "preCrashSafetyStatus";
    static final String antilockBrakeStatus = "antilockBrakeStatus";
    static final String tractionControlStatus = "tractionControlStatus";
    static final String electronicStabilityControlStatus = "electronicStabilityControlStatus";
    static final String laneKeepingAssistStatus = "laneKeepingAssistStatus";
    static final String laneDepartureWarningStatus = "laneDepartureWarningStatus";
    static final String intersectionDistanceInformationAvailability =
        "intersectionDistanceInformationAvailability";
    static final String intersectionDistance = "intersectionDistance";
    static final String intersectionPositionInformationAvailability =
        "intersectionPositionInformationAvailability";
    static final String intersectionLatitude = "intersectionLatitude";
    static final String intersectionLongitude = "intersectionLongitude";
    static final String extendedInformation = "extendedInformation";
    static final String targetIndividualExtendedData = "targetIndividualExtendedData";
    static final String restingState = "restingState";
    static final String existingTime = "existingTime";
  }

  /** 空間IDのズームレベル */
  private static final int ZOOM_LEVEL = 25;

  private final ZoneId targetInfoApiZoneId;
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
   * @param targetInfoApiZoneId TargetInfoApiタイムゾーン
   * @param axispotZoneId Axispotタイムゾーン
   * @throws IllegalArgumentException 指定した入力ファイルパスが不正な場合
   * @throws IllegalArgumentException レスポンスとして解析できない場合
   */
  // NOTE: btkitamurats targetInfoApiZoneIdは時間のデータがオフセットを持っているため未使用である（今後も使わないのであれば削除を検討する）
  // NOTE: btkitamurats axispotZoneIdはAxispotがタイムゾーンを持つデータを追加しないため未使用である（今後も使わないのであれば削除を検討する）
  public TargetInfoResponseParser(
      Path inputFilePath, ZoneId targetInfoApiZoneId, ZoneId axispotZoneId) {
    if (inputFilePath == null || !Files.exists(inputFilePath) || !inputFilePath.toFile().isFile()) {
      String errMsg = MessageFormat.format("inputFilePathが不正: {0}", inputFilePath);
      throw new IllegalArgumentException(errMsg);
    }
    this.targetInfoApiZoneId = targetInfoApiZoneId;
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
   * TargetInfoApiタイムゾーンを取得する。
   *
   * @return TargetInfoApiタイムゾーン
   */
  public ZoneId getTargetInfoApiZoneId() {
    return targetInfoApiZoneId;
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
   * 物標情報リストに変換する。
   *
   * <p>レスポンスをAxispotの時空間データに格納しやすいように変換する。
   *
   * <ul>
   *   <li>複数の情報を保持しているため1件ずつに分解する。
   *   <li>レスポンスは階層構造を持つがフラットな構造にする。
   * </ul>
   *
   * @return 物標情報リスト
   */
  public List<TargetInformation> toTargetInformationList() {
    List<TargetInformation> resultList = new ArrayList<>();
    /* JSONサンプル
    {
      "dataModelType": "test1",
      "attribute": {
        "serviceLocationID": 16777215,
        "roadsideUnitID": 12345678,
        "formatVersion": 1,
        "updateTimeInfo": "2018-01-24T01:25:26.678Z",
        "deviceNum": 4,
        "deviceIndividualInfo": [
          {
            "deviceID": 1111111,
            "targetNum": 2,
            "targetIndividualInfo": [
              {
                "commonServiceStandardID": 1,
                "targetMessageID": 1,
                "targetIndividualVersionInfo": 1,
                "targetID": 11111111,
                "targetIndividualIncrementCounter": 123,
                "dataLength": 123,
                "individualOptionFlag": 123,
                "leapSecondCorrectionInfo": true,
                "time": "2018-01-29T01:23:45.678+09:00",
                "latitude": 123456789,
                "longitude": 1234567891,
                "elevation": 123,
                "positionConf": 1,
                "elevationConf": 2,
                "speed": 1234,
                "heading": 14400,
                "acceleration": 123,
                "speedConf": 1,
                "headingConf": 1,
                "forwardRearAccelerationConf": 1,
                "transmissionState": 1,
                "steeringWheelAngle": 1235,
                "sizeClassification": 2,
                "roleClassification": 1,
                "vehicleWidth": 140,
                "vehicleLength": 180,
                "positionDelay": 31,
                "revisionCounter": 31,
                "roadFacilities": 1,
                "roadClassification": 1,
                "semiMajorAxisOfPositionalErrorEllipse": 15,
                "semiMinorAxisOfPositionalErrorEllipse": 15,
                "semiMajorAxisOrientationOfPositionalErrorEllipse": 7200,
                "GPSPositioningMode": 1,
                "GPSPDOP": 12,
                "numberOfGPSSatellitesInUse": 6,
                "GPSMultiPathDetection": 2,
                "deadReckoningAvailability": false,
                "mapMatchingAvailability": false,
                "yawRate": 12345,
                "brakeAppliedStatus": 12,
                "auxiliaryBrakeAppliedStatus": 1,
                "throttlePosition": 123,
                "exteriorLights": 12,
                "adaptiveCruiseControlStatus": 1,
                "cooperativeAdaptiveCruiseControlStatus": 1,
                "preCrashSafetyStatus": 1,
                "antilockBrakeStatus": 1,
                "tractionControlStatus": 1,
                "electronicStabilityControlStatus": 1,
                "laneKeepingAssistStatus": 1,
                "laneDepartureWarningStatus": 1,
                "intersectionDistanceInformationAvailability": 1,
                "intersectionDistance": 100,
                "intersectionPositionInformationAvailability": 1,
                "intersectionLatitude": 123456789,
                "intersectionLongitude": 1234567891,
                "extendedInformation": 1,
                "targetIndividualExtendedData": "0a1b2c34d5e",
                "restingState": 12,
                "existingTime": 12
              }
            ]
          },
          {
            "deviceID": 12345678,
            "targetNum": 2,
            "targetIndividualInfo": [
              {
                "commonServiceStandardID": 1,
                "targetMessageID": 1,
                "targetIndividualVersionInfo": 1,
                "targetID": 1234567890,
                "targetIndividualIncrementCounter": 123,
                "dataLength": 123,
                "individualOptionFlag": 123,
                "leapSecondCorrectionInfo": true,
                "time": "2024-01-23T01:23:45.678+09:00",
                "latitude": 123456789,
                "longitude": 1234567891,
                "elevation": 123,
                "positionConf": 1,
                "elevationConf": 2,
                "speed": 1234,
                "heading": 14400,
                "acceleration": 123,
                "speedConf": 1,
                "headingConf": 1,
                "forwardRearAccelerationConf": 1,
                "transmissionState": 1,
                "steeringWheelAngle": 1235,
                "sizeClassification": 2,
                "roleClassification": 1,
                "vehicleWidth": 140,
                "vehicleLength": 180,
                "positionDelay": 31,
                "revisionCounter": 31,
                "roadFacilities": 1,
                "roadClassification": 1,
                "semiMajorAxisOfPositionalErrorEllipse": 15,
                "semiMinorAxisOfPositionalErrorEllipse": 15,
                "semiMajorAxisOrientationOfPositionalErrorEllipse": 7200,
                "GPSPositioningMode": 1,
                "GPSPDOP": 12,
                "numberOfGPSSatellitesInUse": 6,
                "GPSMultiPathDetection": 2,
                "deadReckoningAvailability": false,
                "mapMatchingAvailability": false,
                "yawRate": 12345,
                "brakeAppliedStatus": 12,
                "auxiliaryBrakeAppliedStatus": 1,
                "throttlePosition": 123,
                "exteriorLights": 12,
                "adaptiveCruiseControlStatus": 1,
                "cooperativeAdaptiveCruiseControlStatus": 1,
                "preCrashSafetyStatus": 1,
                "antilockBrakeStatus": 1,
                "tractionControlStatus": 1,
                "electronicStabilityControlStatus": 1,
                "laneKeepingAssistStatus": 1,
                "laneDepartureWarningStatus": 1,
                "intersectionDistanceInformationAvailability": 1,
                "intersectionDistance": 100,
                "intersectionPositionInformationAvailability": 1,
                "intersectionLatitude": 123456789,
                "intersectionLongitude": 1234567891,
                "extendedInformation": 1,
                "targetIndividualExtendedData": "0a1b2c34d5e",
                "restingState": 12,
                "existingTime": 12
              }
            ]
          },
          {
            "deviceID": 222222,
            "targetNum": 2,
            "targetIndividualInfo": [
              {
                "commonServiceStandardID": 1,
                "targetMessageID": 1,
                "targetIndividualVersionInfo": 1,
                "targetID": 22222222,
                "targetIndividualIncrementCounter": 123,
                "dataLength": 123,
                "individualOptionFlag": 123,
                "leapSecondCorrectionInfo": true,
                "time": "2018-01-29T01:23:45.679+09:00",
                "latitude": 123456789,
                "longitude": 1234567891,
                "elevation": 123,
                "positionConf": 1,
                "elevationConf": 2,
                "speed": 1234,
                "heading": 14400,
                "acceleration": 123,
                "speedConf": 1,
                "headingConf": 1,
                "forwardRearAccelerationConf": 1,
                "transmissionState": 1,
                "steeringWheelAngle": 1235,
                "sizeClassification": 2,
                "roleClassification": 1,
                "vehicleWidth": 140,
                "vehicleLength": 180,
                "positionDelay": 31,
                "revisionCounter": 31,
                "roadFacilities": 1,
                "roadClassification": 1,
                "semiMajorAxisOfPositionalErrorEllipse": 15,
                "semiMinorAxisOfPositionalErrorEllipse": 15,
                "semiMajorAxisOrientationOfPositionalErrorEllipse": 7200,
                "GPSPositioningMode": 1,
                "GPSPDOP": 12,
                "numberOfGPSSatellitesInUse": 6,
                "GPSMultiPathDetection": 2,
                "deadReckoningAvailability": false,
                "mapMatchingAvailability": false,
                "yawRate": 12345,
                "brakeAppliedStatus": 12,
                "auxiliaryBrakeAppliedStatus": 1,
                "throttlePosition": 123,
                "exteriorLights": 12,
                "adaptiveCruiseControlStatus": 1,
                "cooperativeAdaptiveCruiseControlStatus": 1,
                "preCrashSafetyStatus": 1,
                "antilockBrakeStatus": 1,
                "tractionControlStatus": 1,
                "electronicStabilityControlStatus": 1,
                "laneKeepingAssistStatus": 1,
                "laneDepartureWarningStatus": 1,
                "intersectionDistanceInformationAvailability": 1,
                "intersectionDistance": 100,
                "intersectionPositionInformationAvailability": 1,
                "intersectionLatitude": 123456789,
                "intersectionLongitude": 1234567891,
                "extendedInformation": 1,
                "targetIndividualExtendedData": "0a1b2c34d5e",
                "restingState": 12,
                "existingTime": 12
              },
              {
                "commonServiceStandardID": 1,
                "targetMessageID": 1,
                "targetIndividualVersionInfo": 1,
                "targetID": 22222222,
                "targetIndividualIncrementCounter": 123,
                "dataLength": 123,
                "individualOptionFlag": 123,
                "leapSecondCorrectionInfo": true,
                "time": "2018-01-30T01:23:45.679+09:00",
                "latitude": 123456789,
                "longitude": 1234567891,
                "elevation": 123,
                "positionConf": 1,
                "elevationConf": 2,
                "speed": 1234,
                "heading": 14400,
                "acceleration": 123,
                "speedConf": 1,
                "headingConf": 1,
                "forwardRearAccelerationConf": 1,
                "transmissionState": 1,
                "steeringWheelAngle": 1235,
                "sizeClassification": 2,
                "roleClassification": 1,
                "vehicleWidth": 140,
                "vehicleLength": 180,
                "positionDelay": 31,
                "revisionCounter": 31,
                "roadFacilities": 1,
                "roadClassification": 1,
                "semiMajorAxisOfPositionalErrorEllipse": 15,
                "semiMinorAxisOfPositionalErrorEllipse": 15,
                "semiMajorAxisOrientationOfPositionalErrorEllipse": 7200,
                "GPSPositioningMode": 1,
                "GPSPDOP": 12,
                "numberOfGPSSatellitesInUse": 6,
                "GPSMultiPathDetection": 2,
                "deadReckoningAvailability": false,
                "mapMatchingAvailability": false,
                "yawRate": 12345,
                "brakeAppliedStatus": 12,
                "auxiliaryBrakeAppliedStatus": 1,
                "throttlePosition": 123,
                "exteriorLights": 12,
                "adaptiveCruiseControlStatus": 1,
                "cooperativeAdaptiveCruiseControlStatus": 1,
                "preCrashSafetyStatus": 1,
                "antilockBrakeStatus": 1,
                "tractionControlStatus": 1,
                "electronicStabilityControlStatus": 1,
                "laneKeepingAssistStatus": 1,
                "laneDepartureWarningStatus": 1,
                "intersectionDistanceInformationAvailability": 1,
                "intersectionDistance": 100,
                "intersectionPositionInformationAvailability": 1,
                "intersectionLatitude": 123456789,
                "intersectionLongitude": 1234567891,
                "extendedInformation": 1,
                "targetIndividualExtendedData": "0a1b2c34d5e",
                "restingState": 12,
                "existingTime": 12
              }
            ]
          },
          {
            "deviceID": 333333,
            "targetNum": 2,
            "targetIndividualInfo": [
              {
                "commonServiceStandardID": 1,
                "targetMessageID": 1,
                "targetIndividualVersionInfo": 1,
                "targetID": 33333333,
                "targetIndividualIncrementCounter": 123,
                "dataLength": 123,
                "individualOptionFlag": 123,
                "leapSecondCorrectionInfo": true,
                "time": "2018-01-29T01:23:45.680+09:00",
                "latitude": 123456789,
                "longitude": 1234567891,
                "elevation": 123,
                "positionConf": 1,
                "elevationConf": 2,
                "speed": 1234,
                "heading": 14400,
                "acceleration": 123,
                "speedConf": 1,
                "headingConf": 1,
                "forwardRearAccelerationConf": 1,
                "transmissionState": 1,
                "steeringWheelAngle": 1235,
                "sizeClassification": 2,
                "roleClassification": 1,
                "vehicleWidth": 140,
                "vehicleLength": 180,
                "positionDelay": 31,
                "revisionCounter": 31,
                "roadFacilities": 1,
                "roadClassification": 1,
                "semiMajorAxisOfPositionalErrorEllipse": 15,
                "semiMinorAxisOfPositionalErrorEllipse": 15,
                "semiMajorAxisOrientationOfPositionalErrorEllipse": 7200,
                "GPSPositioningMode": 1,
                "GPSPDOP": 12,
                "numberOfGPSSatellitesInUse": 6,
                "GPSMultiPathDetection": 2,
                "deadReckoningAvailability": false,
                "mapMatchingAvailability": false,
                "yawRate": 12345,
                "brakeAppliedStatus": 12,
                "auxiliaryBrakeAppliedStatus": 1,
                "throttlePosition": 123,
                "exteriorLights": 12,
                "adaptiveCruiseControlStatus": 1,
                "cooperativeAdaptiveCruiseControlStatus": 1,
                "preCrashSafetyStatus": 1,
                "antilockBrakeStatus": 1,
                "tractionControlStatus": 1,
                "electronicStabilityControlStatus": 1,
                "laneKeepingAssistStatus": 1,
                "laneDepartureWarningStatus": 1,
                "intersectionDistanceInformationAvailability": 1,
                "intersectionDistance": 100,
                "intersectionPositionInformationAvailability": 1,
                "intersectionLatitude": 123456789,
                "intersectionLongitude": 1234567891,
                "extendedInformation": 1,
                "targetIndividualExtendedData": "0a1b2c34d5e",
                "restingState": 12,
                "existingTime": 12
              },
              {
                "commonServiceStandardID": 1,
                "targetMessageID": 1,
                "targetIndividualVersionInfo": 1,
                "targetID": 33333333,
                "targetIndividualIncrementCounter": 123,
                "dataLength": 123,
                "individualOptionFlag": 123,
                "leapSecondCorrectionInfo": true,
                "time": "2018-01-30T01:23:45.680+09:00",
                "latitude": 123456789,
                "longitude": 1234567891,
                "elevation": 123,
                "positionConf": 1,
                "elevationConf": 2,
                "speed": 1234,
                "heading": 14400,
                "acceleration": 123,
                "speedConf": 1,
                "headingConf": 1,
                "forwardRearAccelerationConf": 1,
                "transmissionState": 1,
                "steeringWheelAngle": 1235,
                "sizeClassification": 2,
                "roleClassification": 1,
                "vehicleWidth": 140,
                "vehicleLength": 180,
                "positionDelay": 31,
                "revisionCounter": 31,
                "roadFacilities": 1,
                "roadClassification": 1,
                "semiMajorAxisOfPositionalErrorEllipse": 15,
                "semiMinorAxisOfPositionalErrorEllipse": 15,
                "semiMajorAxisOrientationOfPositionalErrorEllipse": 7200,
                "GPSPositioningMode": 1,
                "GPSPDOP": 12,
                "numberOfGPSSatellitesInUse": 6,
                "GPSMultiPathDetection": 2,
                "deadReckoningAvailability": false,
                "mapMatchingAvailability": false,
                "yawRate": 12345,
                "brakeAppliedStatus": 12,
                "auxiliaryBrakeAppliedStatus": 1,
                "throttlePosition": 123,
                "exteriorLights": 12,
                "adaptiveCruiseControlStatus": 1,
                "cooperativeAdaptiveCruiseControlStatus": 1,
                "preCrashSafetyStatus": 1,
                "antilockBrakeStatus": 1,
                "tractionControlStatus": 1,
                "electronicStabilityControlStatus": 1,
                "laneKeepingAssistStatus": 1,
                "laneDepartureWarningStatus": 1,
                "intersectionDistanceInformationAvailability": 1,
                "intersectionDistance": 100,
                "intersectionPositionInformationAvailability": 1,
                "intersectionLatitude": 123456789,
                "intersectionLongitude": 1234567891,
                "extendedInformation": 1,
                "targetIndividualExtendedData": "0a1b2c34d5e",
                "restingState": 12,
                "existingTime": 12
              }
            ]
          }
        ]
      }
    }
    */
    Optional<String> dataModelType =
        Optional.ofNullable((String) this.inputMap.get(Key.dataModelType));
    Map<String, Object> attribute = (Map<String, Object>) this.inputMap.get(Key.attribute);
    // IntegerまたはLongの場合があるためNumberにキャストしてlongValue()で値を取得する
    Number serviceLocationID = (Number) attribute.get(Key.serviceLocationID);
    // IntegerまたはLongの場合があるためNumberにキャストしてlongValue()で値を取得する
    Number roadsideUnitID = (Number) attribute.get(Key.roadsideUnitID);
    String updateTimeInfo = (String) attribute.get(Key.updateTimeInfo);
    int formatVersion = (Integer) attribute.get(Key.formatVersion);
    int deviceNum = (Integer) attribute.get(Key.deviceNum);
    List<Map<String, Object>> deviceIndividualInfo =
        (List<Map<String, Object>>) attribute.get(Key.deviceIndividualInfo);
    for (Map<String, Object> device : deviceIndividualInfo) {
      int deviceID = (Integer) device.get(Key.deviceID);
      int targetNum = (Integer) device.get(Key.targetNum);
      List<Map<String, Object>> targetIndividualInfo =
          (List<Map<String, Object>>) device.get(Key.targetIndividualInfo);
      logger.debug("targetIndividualInfo : {}", targetIndividualInfo);
      for (Map<String, Object> target : targetIndividualInfo) {
        int commonServiceStandardID = (Integer) target.get(Key.commonServiceStandardID);
        int targetMessageID = (Integer) target.get(Key.targetMessageID);
        int targetIndividualVersionInfo = (Integer) target.get(Key.targetIndividualVersionInfo);
        long targetID = (Integer) target.get(Key.targetID);
        int targetIndividualIncrementCounter =
            (Integer) target.get(Key.targetIndividualIncrementCounter);
        int dataLength = (Integer) target.get(Key.dataLength);
        Optional<Integer> individualOptionFlag =
            Optional.ofNullable((Integer) target.get(Key.individualOptionFlag));
        boolean leapSecondCorrectionInfo = (Boolean) target.get(Key.leapSecondCorrectionInfo);
        String time = (String) target.get(Key.time);
        int latitude = (Integer) target.get(Key.latitude);
        int longitude = (Integer) target.get(Key.longitude);
        int elevation = (Integer) target.get(Key.elevation);
        int positionConf = (Integer) target.get(Key.positionConf);
        int elevationConf = (Integer) target.get(Key.elevationConf);
        int speed = (Integer) target.get(Key.speed);
        int heading = (Integer) target.get(Key.heading);
        int acceleration = (Integer) target.get(Key.acceleration);
        int speedConf = (Integer) target.get(Key.speedConf);
        int headingConf = (Integer) target.get(Key.headingConf);
        int forwardRearAccelerationConf = (Integer) target.get(Key.forwardRearAccelerationConf);
        int transmissionState = (Integer) target.get(Key.transmissionState);
        int steeringWheelAngle = (Integer) target.get(Key.steeringWheelAngle);
        int sizeClassification = (Integer) target.get(Key.sizeClassification);
        int roleClassification = (Integer) target.get(Key.roleClassification);
        int vehicleWidth = (Integer) target.get(Key.vehicleWidth);
        int vehicleLength = (Integer) target.get(Key.vehicleLength);
        Optional<Integer> positionDelay =
            Optional.ofNullable((Integer) target.get(Key.positionDelay));
        Optional<Integer> revisionCounter =
            Optional.ofNullable((Integer) target.get(Key.revisionCounter));
        Optional<Integer> roadFacilities =
            Optional.ofNullable((Integer) target.get(Key.roadFacilities));
        Optional<Integer> roadClassification =
            Optional.ofNullable((Integer) target.get(Key.roadClassification));
        Optional<Integer> semiMajorAxisOfPositionalErrorEllipse =
            Optional.ofNullable((Integer) target.get(Key.semiMajorAxisOfPositionalErrorEllipse));
        Optional<Integer> semiMinorAxisOfPositionalErrorEllipse =
            Optional.ofNullable((Integer) target.get(Key.semiMinorAxisOfPositionalErrorEllipse));
        Optional<Integer> semiMajorAxisOrientationOfPositionalErrorEllipse =
            Optional.ofNullable(
                (Integer) target.get(Key.semiMajorAxisOrientationOfPositionalErrorEllipse));
        Optional<Integer> GPSPositioningMode =
            Optional.ofNullable((Integer) target.get(Key.GPSPositioningMode));
        Optional<Integer> GPSPDOP = Optional.ofNullable((Integer) target.get(Key.GPSPDOP));
        Optional<Integer> numberOfGPSSatellitesInUse =
            Optional.ofNullable((Integer) target.get(Key.numberOfGPSSatellitesInUse));
        Optional<Integer> GPSMultiPathDetection =
            Optional.ofNullable((Integer) target.get(Key.GPSMultiPathDetection));
        Optional<Boolean> deadReckoningAvailability =
            Optional.ofNullable((Boolean) target.get(Key.deadReckoningAvailability));
        Optional<Boolean> mapMatchingAvailability =
            Optional.ofNullable((Boolean) target.get(Key.mapMatchingAvailability));
        Optional<Integer> yawRate = Optional.ofNullable((Integer) target.get(Key.yawRate));
        Optional<Integer> brakeAppliedStatus =
            Optional.ofNullable((Integer) target.get(Key.brakeAppliedStatus));
        Optional<Integer> auxiliaryBrakeAppliedStatus =
            Optional.ofNullable((Integer) target.get(Key.auxiliaryBrakeAppliedStatus));
        Optional<Integer> throttlePosition =
            Optional.ofNullable((Integer) target.get(Key.throttlePosition));
        Optional<Integer> exteriorLights =
            Optional.ofNullable((Integer) target.get(Key.exteriorLights));
        Optional<Integer> adaptiveCruiseControlStatus =
            Optional.ofNullable((Integer) target.get(Key.adaptiveCruiseControlStatus));
        Optional<Integer> cooperativeAdaptiveCruiseControlStatus =
            Optional.ofNullable((Integer) target.get(Key.cooperativeAdaptiveCruiseControlStatus));
        Optional<Integer> preCrashSafetyStatus =
            Optional.ofNullable((Integer) target.get(Key.preCrashSafetyStatus));
        Optional<Integer> antilockBrakeStatus =
            Optional.ofNullable((Integer) target.get(Key.antilockBrakeStatus));
        Optional<Integer> tractionControlStatus =
            Optional.ofNullable((Integer) target.get(Key.tractionControlStatus));
        Optional<Integer> electronicStabilityControlStatus =
            Optional.ofNullable((Integer) target.get(Key.electronicStabilityControlStatus));
        Optional<Integer> laneKeepingAssistStatus =
            Optional.ofNullable((Integer) target.get(Key.laneKeepingAssistStatus));
        Optional<Integer> laneDepartureWarningStatus =
            Optional.ofNullable((Integer) target.get(Key.laneDepartureWarningStatus));
        Optional<Integer> intersectionDistanceInformationAvailability =
            Optional.ofNullable(
                (Integer) target.get(Key.intersectionDistanceInformationAvailability));
        Optional<Integer> intersectionDistance =
            Optional.ofNullable((Integer) target.get(Key.intersectionDistance));
        Optional<Integer> intersectionPositionInformationAvailability =
            Optional.ofNullable(
                (Integer) target.get(Key.intersectionPositionInformationAvailability));
        Optional<Integer> intersectionLatitude =
            Optional.ofNullable((Integer) target.get(Key.intersectionLatitude));
        Optional<Integer> intersectionLongitude =
            Optional.ofNullable((Integer) target.get(Key.intersectionLongitude));
        Optional<Integer> extendedInformation =
            Optional.ofNullable((Integer) target.get(Key.extendedInformation));
        Optional<String> targetIndividualExtendedData =
            Optional.ofNullable((String) target.get(Key.targetIndividualExtendedData));
        Optional<Integer> restingState =
            Optional.ofNullable((Integer) target.get(Key.restingState));
        Optional<Integer> existingTime =
            Optional.ofNullable((Integer) target.get(Key.existingTime));

        // AxispotのidにはtargetIDを設定
        String id = String.valueOf(targetID);
        // Axispotのtimeに設定するエポック秒をTargetInfoのtimeから算出する（TargetInfoのtimeはISO8601形式を想定）
        long timeEpochSecond =
            ZonedDateTime.parse(
                    (String) target.get(Key.time), DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                .toEpochSecond();
        // TargetInfoの経度、緯度は整数のため小数に変換する
        double latitudeAsDouble = (double) latitude / 10000000;
        double longitudeAsDouble = (double) longitude / 10000000;
        double elevationAsDouble = (double) elevation / 10;
        // 空間IDを生成
        String spatialId = null;
        try {
          spatialId =
              new SpatialId(ZOOM_LEVEL, elevationAsDouble, longitudeAsDouble, latitudeAsDouble)
                  .formatToZfxy();
        } catch (IllegalArgumentException e) {
          logger.warn("空間IDが生成できないデータのため変換をスキップ: targetID={}", targetID, e);
          continue;
        }

        TargetInformation info =
            new TargetInformation(
                getAxispotZoneId(),
                id,
                longitudeAsDouble,
                latitudeAsDouble,
                elevationAsDouble,
                timeEpochSecond,
                spatialId,
                dataModelType,
                serviceLocationID.longValue(),
                roadsideUnitID.longValue(),
                updateTimeInfo,
                formatVersion,
                deviceNum,
                deviceID,
                targetNum,
                commonServiceStandardID,
                targetMessageID,
                targetIndividualVersionInfo,
                targetID,
                targetIndividualIncrementCounter,
                dataLength,
                individualOptionFlag,
                leapSecondCorrectionInfo,
                time,
                latitude,
                longitude,
                elevation,
                positionConf,
                elevationConf,
                speed,
                heading,
                acceleration,
                speedConf,
                headingConf,
                forwardRearAccelerationConf,
                transmissionState,
                steeringWheelAngle,
                sizeClassification,
                roleClassification,
                vehicleWidth,
                vehicleLength,
                positionDelay,
                revisionCounter,
                roadFacilities,
                roadClassification,
                semiMajorAxisOfPositionalErrorEllipse,
                semiMinorAxisOfPositionalErrorEllipse,
                semiMajorAxisOrientationOfPositionalErrorEllipse,
                GPSPositioningMode,
                GPSPDOP,
                numberOfGPSSatellitesInUse,
                GPSMultiPathDetection,
                deadReckoningAvailability,
                mapMatchingAvailability,
                yawRate,
                brakeAppliedStatus,
                auxiliaryBrakeAppliedStatus,
                throttlePosition,
                exteriorLights,
                adaptiveCruiseControlStatus,
                cooperativeAdaptiveCruiseControlStatus,
                preCrashSafetyStatus,
                antilockBrakeStatus,
                tractionControlStatus,
                electronicStabilityControlStatus,
                laneKeepingAssistStatus,
                laneDepartureWarningStatus,
                intersectionDistanceInformationAvailability,
                intersectionDistance,
                intersectionPositionInformationAvailability,
                intersectionLatitude,
                intersectionLongitude,
                extendedInformation,
                targetIndividualExtendedData,
                restingState,
                existingTime);

        resultList.add(info);
      }
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
