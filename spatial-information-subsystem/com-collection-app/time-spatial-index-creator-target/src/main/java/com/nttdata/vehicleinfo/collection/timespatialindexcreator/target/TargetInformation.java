package com.nttdata.vehicleinfo.collection.timespatialindexcreator.target;

import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 物標情報
 *
 * @param zoneId Axispotタイムゾーン。現在は未使用。
 * @param id 識別子。AxispotのMovingObjectStoreData.getMovingObjectId()に対応する。
 * @param longitude 経度。時空間インデックスの算出に用いる経度と同じ値を設定する。AxispotのMovingObjectStoreData.getCoord().xに対応する。
 * @param latitude 緯度。時空間インデックスの算出に用いる緯度と同じ値を設定する。AxispotのMovingObjectStoreData.getCoord().yに対応する。
 * @param altitude 高度。時空間インデックスの算出に用いる高度と同じ値を設定する。AxispotのMovingObjectStoreData.getCoord().zに対応する。
 * @param time
 *     時間（エポック秒）。時空間インデックスの算出に用いる時間と同じ値を設定する。AxispotのMovingObjectStoreData.getCreatedAt()に対応する。
 * @param spatialId
 *     空間ID（ズームレベル25）。AxispotのMovingObjectStoreData.getAttributes().get("spatialId")に対応する。
 * @param dataModelType データモデルタイプ 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("dataModelType")に対応する。
 * @param serviceLocationID サービス地点ID 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("serviceLocationID")に対応する。
 * @param roadsideUnitID 路側機ID 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("roadsideUnitID")に対応する。
 * @param updateTimeInfo 最新更新時刻(UTC) 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("updateTimeInfo")に対応する。
 * @param formatVersion フォーマットバージョン 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("formatVersion")に対応する。
 * @param deviceNum 接続数 。 AxispotのMovingObjectStoreData.getAttributes().get("deviceNum")に対応する。
 * @param deviceID 機器識別ID 。 AxispotのMovingObjectStoreData.getAttributes().get("deviceID")に対応する。
 * @param targetNum 取得物標数 。 AxispotのMovingObjectStoreData.getAttributes().get("targetNum")に対応する。
 * @param commonServiceStandardID 共通サービス規格（このメッセージが準ずる規格）を識別するID情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("commonServiceStandardID")に対応する。
 * @param targetMessageID メッセージを識別するID情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("targetMessageID")に対応する。
 * @param targetIndividualVersionInfo メッセージのバージョン情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("targetIndividualVersionInfo")に対応する。
 * @param targetID 前回送信時と同一物標かどうかを識別できるように路側機が付与するID情報(物標ID) 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("targetID")に対応する。
 * @param targetIndividualIncrementCounter データ送信順を示す番号 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("targetIndividualIncrementCounter")に対応する。
 * @param dataLength 物標個別拡張領域を除いた物標個別情報のサイズをバイト数で表す 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("dataLength")に対応する。
 * @param individualOptionFlag 格納するオプション情報を示すフラグ情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("individualOptionFlag")に対応する。
 * @param leapSecondCorrectionInfo うるう秒補正の有無を示す情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("leapSecondCorrectionInfo")に対応する。
 * @param targetIndividualInfoTime 物標情報が生成された時刻(ミリ秒まで)(JST) 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("time")に対応する。
 * @param targetIndividualInfoLatitude ' 物標の緯度情報．計測系はWGS84．北緯をプラス, 南緯をマイナスで表現(分解能: 0.0000001度)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("latitude")に対応する。
 * @param targetIndividualInfoLongitude '物標の経度情報．計測系はWGS84．東経をプラス, 西経をマイナスで表現(分解能: 0.0000001度)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("longitude")に対応する。
 * @param elevation '物標の基準面からの高さ情報(分解能: 0.1m)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("elevation")に対応する。
 * @param positionConf 緯度・経度の信頼度を示す情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("positionConf")に対応する。
 * @param elevationConf 高度の信頼度を示す情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("elevationConf")に対応する。
 * @param speed '物標の速度(単位: m/s)．(分解能: 0.01m/s)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("speed")に対応する。
 * @param heading '物標の進行方位角情報．北を0度とし，時計回りの角度値をセットする．(分解能: 0.0125度)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("heading")に対応する。
 * @param acceleration '物標の前後方向の加速度(単位：m/s^2)．(分解能: 0.01m/s^2)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("acceleration")に対応する。
 * @param speedConf 物標の速度の信頼度を示す情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("speedConf")に対応する。
 * @param headingConf 物標の方位角の信頼度を示す情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("headingConf")に対応する。
 * @param forwardRearAccelerationConf 物標の前後方向加速度の信頼度を示す情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("forwardRearAccelerationConf")に対応する。
 * @param transmissionState 車両のシフトポジション情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("transmissionState")に対応する。
 * @param steeringWheelAngle 'ステアリングの操舵角度情報．プラスを時計回りとする．(分解能: 1.5度)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("steeringWheelAngle")に対応する。
 * @param sizeClassification 物標の種別 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("sizeClassification")に対応する。
 * @param roleClassification 物標が車両の場合の用途種別．車両以外の場合15(その他)とする 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("roleClassification")に対応する。
 * @param vehicleWidth '自車両の全幅情報(単位：m). (分解能: 0.01m)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("vehicleWidth")に対応する。
 * @param vehicleLength '自車両の全長情報(単位：m)．(分解能: 0.01m)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("vehicleLength")に対応する。
 * @param positionDelay 測位データ更新周期情報(単位：ms) (分解能：100ms) 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("positionDelay")に対応する。
 * @param revisionCounter 'GPSレシーバからデータ受信したタイミングから同じデータを送信している期間の情報(単位: ms) (分解能：100ms)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("revisionCounter")に対応する。
 * @param roadFacilities 走行あるいは停車している場所の道路施設情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("roadFacilities")に対応する。
 * @param roadClassification 走行している道路の道路区分情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("roadClassification")に対応する。
 * @param semiMajorAxisOfPositionalErrorEllipse 'GPSにより取得した位置情報の信頼度指標である水平方向の誤差楕円（2σ）の長半径情報(単位:m)
 *     (分解能: 0.5m)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("semiMajorAxisOfPositionalErrorEllipse")に対応する。
 * @param semiMinorAxisOfPositionalErrorEllipse 'GPSにより取得した位置情報の信頼度指標である水平方向の誤差楕円（2σ）の短半径情報(単位:m)
 *     (分解能: 0.5m)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("semiMinorAxisOfPositionalErrorEllipse")に対応する。
 * @param semiMajorAxisOrientationOfPositionalErrorEllipse
 *     'GPSにより取得した位置情報の信頼度指標である水平方向の誤差楕円（2σ）の回転角情報．楕円長軸の角度として、北を0度とし時計回りの角度値をセットする. (分解能: 0.0125度)'
 *     。
 *     AxispotのMovingObjectStoreData.getAttributes().get("semiMajorAxisOrientationOfPositionalErrorEllipse")に対応する。
 * @param GPSPositioningMode GPSにより取得した位置情報が、どのような測位モードで測位されたものかを示す情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("GPSPositioningMode")に対応する。
 * @param GPSPDOP 'GPSにより取得した位置情報が、衛星の幾何学的配置によりどれくらい位置精度へ影響を受けた状態で取得したものかを示す情報. (分解能: 0.2)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("GPSPDOP")に対応する。
 * @param numberOfGPSSatellitesInUse GPSにより取得した位置情報が、いくつのGPS衛星を捕捉した状態で取得したものかを示す情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("numberOfGPSSatellitesInUse")に対応する。
 * @param GPSMultiPathDetection GPSにより取得した位置情報が、マルチパスの状況（GPS衛星から
 *     発射された電波が周辺の建物等により反射され、それらを受信する状況）下で取得されたものかを示す情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("GPSMultiPathDetection")に対応する。
 * @param deadReckoningAvailability 各種センサ等を用いた自律航法機能を搭載しているかを示す情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("deadReckoningAvailability")に対応する。
 * @param mapMatchingAvailability 自車両の位置情報に対するマップマッチング機能を搭載しているかを示す情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("mapMatchingAvailability")に対応する。
 * @param yawRate '自車両のヨーレート情報．プラスを時計回りとする(単位: 度/s) (分解能: 0.01度/s)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("yawRate")に対応する。
 * @param brakeAppliedStatus
 *     自車両のブレーキ状態情報．車輪別にブレーキ状態を取得出来ない場合は、[5]の値を0にセットし、ブレーキのOFF/ONに従い[0]～[3]の値は全て同じ値をセットする 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("brakeAppliedStatus")に対応する。
 * @param auxiliaryBrakeAppliedStatus 自車両の補助ブレーキ状態情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("auxiliaryBrakeAppliedStatus")に対応する。
 * @param throttlePosition 'アクセルペダルの操作量をセットする(単位:%). (分解能: 0.5%)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("throttlePosition")に対応する。
 * @param exteriorLights 自車両のウィンカー、ハザード、前照灯の状態情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("exteriorLights")に対応する。
 * @param adaptiveCruiseControlStatus 自車両のACC（Adaptive Cruise Control System）の作動状態情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("adaptiveCruiseControlStatus")に対応する。
 * @param cooperativeAdaptiveCruiseControlStatus 自車両のC-ACC（Cooperative Adaptive Cruise Control
 *     System）の作動状態情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("cooperativeAdaptiveCruiseControlStatus")に対応する。
 * @param preCrashSafetyStatus 自車両の PCS（Pre-Crash Safety System）の作動状態情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("preCrashSafetyStatus")に対応する。
 * @param antilockBrakeStatus 自車両のABS（Antilock Brake System）の作動状態情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("antilockBrakeStatus")に対応する。
 * @param tractionControlStatus 自車両のTRC（Traction Control System）の作動状態情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("tractionControlStatus")に対応する。
 * @param electronicStabilityControlStatus 自車両のESC（Electronic Stability Control System）の作動状態情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("electronicStabilityControlStatus")に対応する。
 * @param laneKeepingAssistStatus 自車両のLKA（Lane Keeping Assist System）の作動状態情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("laneKeepingAssistStatus")に対応する。
 * @param laneDepartureWarningStatus 自車両のLDW（Lane Departure Warning System）の作動状態情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("laneDepartureWarningStatus")に対応する。
 * @param intersectionDistanceInformationAvailability 前方直近の交差点までの距離情報の取得先情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("intersectionDistanceInformationAvailability")に対応する。
 * @param intersectionDistance 前方直近の交差点までの道のり距離情報(単位：m) 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("intersectionDistance")に対応する。
 * @param intersectionPositionInformationAvailability 前方直近の交差点の位置情報の取得先情報 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("intersectionPositionInformationAvailability")に対応する。
 * @param intersectionLatitude '前方直近の交差点の緯度情報．計測系はWGS84．北緯をプラス, 南緯をマイナスで表現 (分解能: 0.0000001度)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("intersectionLatitude")に対応する。
 * @param intersectionLongitude '前方直近の交差点の経度情報．計測系はWGS84．東経をプラス, 西経をマイナスで表現 (分解能: 0.0000001度)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("intersectionLongitude")に対応する。
 * @param extendedInformation DE_車両用途種別によって，RC-013に定義されているDEを参照 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("extendedInformation")に対応する。
 * @param targetIndividualExtendedData 個別拡張情報は利用ユーザによってデータ内容が異なるためbyte文字列をそのまま格納し利用する 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("targetIndividualExtendedData")に対応する。
 * @param restingState 物標が停止してからの経過時間(単位:秒) 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("restingState")に対応する。
 * @param existingTime '物標が検知されている時間(単位:秒)．(分解能: 0.1秒)' 。
 *     AxispotのMovingObjectStoreData.getAttributes().get("existingTime")に対応する。
 */
public record TargetInformation(
    ZoneId zoneId,
    String id,
    double longitude,
    double latitude,
    double altitude,
    long time,
    String spatialId,
    Optional<String> dataModelType,
    long serviceLocationID,
    long roadsideUnitID,
    String updateTimeInfo,
    int formatVersion,
    int deviceNum,
    int deviceID,
    int targetNum,
    int commonServiceStandardID,
    int targetMessageID,
    int targetIndividualVersionInfo,
    long targetID,
    int targetIndividualIncrementCounter,
    int dataLength,
    Optional<Integer> individualOptionFlag,
    boolean leapSecondCorrectionInfo,
    // JSONはtimeだがAxispotのtimeと競合するため接頭語にtargetIndividualInfoを付与する
    String targetIndividualInfoTime,
    // JSONはlatitudeだがAxispotのlatitudeと競合するため接頭語にtargetIndividualInfoを付与する
    int targetIndividualInfoLatitude,
    // JSONはlongtitudeだがAxispotのlongtitudeと競合するため接頭語にtargetIndividualInfoを付与する
    int targetIndividualInfoLongitude,
    int elevation,
    int positionConf,
    int elevationConf,
    int speed,
    int heading,
    int acceleration,
    int speedConf,
    int headingConf,
    int forwardRearAccelerationConf,
    int transmissionState,
    int steeringWheelAngle,
    int sizeClassification,
    int roleClassification,
    int vehicleWidth,
    int vehicleLength,
    Optional<Integer> positionDelay,
    Optional<Integer> revisionCounter,
    Optional<Integer> roadFacilities,
    Optional<Integer> roadClassification,
    Optional<Integer> semiMajorAxisOfPositionalErrorEllipse,
    Optional<Integer> semiMinorAxisOfPositionalErrorEllipse,
    Optional<Integer> semiMajorAxisOrientationOfPositionalErrorEllipse,
    Optional<Integer> GPSPositioningMode,
    Optional<Integer> GPSPDOP,
    Optional<Integer> numberOfGPSSatellitesInUse,
    Optional<Integer> GPSMultiPathDetection,
    Optional<Boolean> deadReckoningAvailability,
    Optional<Boolean> mapMatchingAvailability,
    Optional<Integer> yawRate,
    Optional<Integer> brakeAppliedStatus,
    Optional<Integer> auxiliaryBrakeAppliedStatus,
    Optional<Integer> throttlePosition,
    Optional<Integer> exteriorLights,
    Optional<Integer> adaptiveCruiseControlStatus,
    Optional<Integer> cooperativeAdaptiveCruiseControlStatus,
    Optional<Integer> preCrashSafetyStatus,
    Optional<Integer> antilockBrakeStatus,
    Optional<Integer> tractionControlStatus,
    Optional<Integer> electronicStabilityControlStatus,
    Optional<Integer> laneKeepingAssistStatus,
    Optional<Integer> laneDepartureWarningStatus,
    Optional<Integer> intersectionDistanceInformationAvailability,
    Optional<Integer> intersectionDistance,
    Optional<Integer> intersectionPositionInformationAvailability,
    Optional<Integer> intersectionLatitude,
    Optional<Integer> intersectionLongitude,
    Optional<Integer> extendedInformation,
    Optional<String> targetIndividualExtendedData,
    Optional<Integer> restingState,
    Optional<Integer> existingTime) {

  /** Axispotの時空間データの属性のキー */
  static class Attribute {
    /** 空間ID */
    static final String spatialId = "spatialId";

    static final String dataModelType = "dataModelType";
    static final String serviceLocationID = "serviceLocationID";
    static final String roadsideUnitID = "roadsideUnitID";
    static final String updateTimeInfo = "updateTimeInfo";
    static final String formatVersion = "formatVersion";
    static final String deviceNum = "deviceNum";
    static final String deviceID = "deviceID";
    static final String targetNum = "targetNum";
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

  /**
   * Axispotの時空間データの属性Mapに変換する。
   *
   * @return Axispotの時空間データの属性Map
   */
  public Map<String, String> toAttributes() {
    Map<String, String> r = new HashMap<>();
    r.put(Attribute.spatialId, String.valueOf(spatialId()));
    dataModelType().ifPresent(v -> r.put(Attribute.dataModelType, String.valueOf(v)));
    r.put(Attribute.serviceLocationID, String.valueOf(serviceLocationID()));
    r.put(Attribute.roadsideUnitID, String.valueOf(roadsideUnitID()));
    r.put(Attribute.updateTimeInfo, String.valueOf(updateTimeInfo()));
    r.put(Attribute.formatVersion, String.valueOf(formatVersion()));
    r.put(Attribute.deviceNum, String.valueOf(deviceNum()));
    r.put(Attribute.deviceID, String.valueOf(deviceID()));
    r.put(Attribute.targetNum, String.valueOf(targetNum()));
    r.put(Attribute.commonServiceStandardID, String.valueOf(commonServiceStandardID()));
    r.put(Attribute.targetMessageID, String.valueOf(targetMessageID()));
    r.put(Attribute.targetIndividualVersionInfo, String.valueOf(targetIndividualVersionInfo()));
    r.put(Attribute.targetID, String.valueOf(targetID()));
    r.put(
        Attribute.targetIndividualIncrementCounter,
        String.valueOf(targetIndividualIncrementCounter()));
    r.put(Attribute.dataLength, String.valueOf(dataLength()));
    individualOptionFlag().ifPresent(v -> r.put(Attribute.individualOptionFlag, String.valueOf(v)));
    r.put(Attribute.leapSecondCorrectionInfo, String.valueOf(leapSecondCorrectionInfo()));
    r.put(Attribute.time, String.valueOf(targetIndividualInfoTime()));
    r.put(Attribute.latitude, String.valueOf(targetIndividualInfoLatitude()));
    r.put(Attribute.longitude, String.valueOf(targetIndividualInfoLongitude()));
    r.put(Attribute.elevation, String.valueOf(elevation()));
    r.put(Attribute.positionConf, String.valueOf(positionConf()));
    r.put(Attribute.elevationConf, String.valueOf(elevationConf()));
    r.put(Attribute.speed, String.valueOf(speed()));
    r.put(Attribute.heading, String.valueOf(heading()));
    r.put(Attribute.acceleration, String.valueOf(acceleration()));
    r.put(Attribute.speedConf, String.valueOf(speedConf()));
    r.put(Attribute.headingConf, String.valueOf(headingConf()));
    r.put(Attribute.forwardRearAccelerationConf, String.valueOf(forwardRearAccelerationConf()));
    r.put(Attribute.transmissionState, String.valueOf(transmissionState()));
    r.put(Attribute.steeringWheelAngle, String.valueOf(steeringWheelAngle()));
    r.put(Attribute.sizeClassification, String.valueOf(sizeClassification()));
    r.put(Attribute.roleClassification, String.valueOf(roleClassification()));
    r.put(Attribute.vehicleWidth, String.valueOf(vehicleWidth()));
    r.put(Attribute.vehicleLength, String.valueOf(vehicleLength()));
    positionDelay().ifPresent(v -> r.put(Attribute.positionDelay, String.valueOf(v)));
    revisionCounter().ifPresent(v -> r.put(Attribute.revisionCounter, String.valueOf(v)));
    roadFacilities().ifPresent(v -> r.put(Attribute.roadFacilities, String.valueOf(v)));
    roadClassification().ifPresent(v -> r.put(Attribute.roadClassification, String.valueOf(v)));
    semiMajorAxisOfPositionalErrorEllipse()
        .ifPresent(v -> r.put(Attribute.semiMajorAxisOfPositionalErrorEllipse, String.valueOf(v)));
    semiMinorAxisOfPositionalErrorEllipse()
        .ifPresent(v -> r.put(Attribute.semiMinorAxisOfPositionalErrorEllipse, String.valueOf(v)));
    semiMajorAxisOrientationOfPositionalErrorEllipse()
        .ifPresent(
            v ->
                r.put(
                    Attribute.semiMajorAxisOrientationOfPositionalErrorEllipse, String.valueOf(v)));
    GPSPositioningMode().ifPresent(v -> r.put(Attribute.GPSPositioningMode, String.valueOf(v)));
    GPSPDOP().ifPresent(v -> r.put(Attribute.GPSPDOP, String.valueOf(v)));
    numberOfGPSSatellitesInUse()
        .ifPresent(v -> r.put(Attribute.numberOfGPSSatellitesInUse, String.valueOf(v)));
    GPSMultiPathDetection()
        .ifPresent(v -> r.put(Attribute.GPSMultiPathDetection, String.valueOf(v)));
    deadReckoningAvailability()
        .ifPresent(v -> r.put(Attribute.deadReckoningAvailability, String.valueOf(v)));
    mapMatchingAvailability()
        .ifPresent(v -> r.put(Attribute.mapMatchingAvailability, String.valueOf(v)));
    yawRate().ifPresent(v -> r.put(Attribute.yawRate, String.valueOf(v)));
    brakeAppliedStatus().ifPresent(v -> r.put(Attribute.brakeAppliedStatus, String.valueOf(v)));
    auxiliaryBrakeAppliedStatus()
        .ifPresent(v -> r.put(Attribute.auxiliaryBrakeAppliedStatus, String.valueOf(v)));
    throttlePosition().ifPresent(v -> r.put(Attribute.throttlePosition, String.valueOf(v)));
    exteriorLights().ifPresent(v -> r.put(Attribute.exteriorLights, String.valueOf(v)));
    adaptiveCruiseControlStatus()
        .ifPresent(v -> r.put(Attribute.adaptiveCruiseControlStatus, String.valueOf(v)));
    cooperativeAdaptiveCruiseControlStatus()
        .ifPresent(v -> r.put(Attribute.cooperativeAdaptiveCruiseControlStatus, String.valueOf(v)));
    preCrashSafetyStatus().ifPresent(v -> r.put(Attribute.preCrashSafetyStatus, String.valueOf(v)));
    antilockBrakeStatus().ifPresent(v -> r.put(Attribute.antilockBrakeStatus, String.valueOf(v)));
    tractionControlStatus()
        .ifPresent(v -> r.put(Attribute.tractionControlStatus, String.valueOf(v)));
    electronicStabilityControlStatus()
        .ifPresent(v -> r.put(Attribute.electronicStabilityControlStatus, String.valueOf(v)));
    laneKeepingAssistStatus()
        .ifPresent(v -> r.put(Attribute.laneKeepingAssistStatus, String.valueOf(v)));
    laneDepartureWarningStatus()
        .ifPresent(v -> r.put(Attribute.laneDepartureWarningStatus, String.valueOf(v)));
    intersectionDistanceInformationAvailability()
        .ifPresent(
            v -> r.put(Attribute.intersectionDistanceInformationAvailability, String.valueOf(v)));
    intersectionDistance().ifPresent(v -> r.put(Attribute.intersectionDistance, String.valueOf(v)));
    intersectionPositionInformationAvailability()
        .ifPresent(
            v -> r.put(Attribute.intersectionPositionInformationAvailability, String.valueOf(v)));
    intersectionLatitude().ifPresent(v -> r.put(Attribute.intersectionLatitude, String.valueOf(v)));
    intersectionLongitude()
        .ifPresent(v -> r.put(Attribute.intersectionLongitude, String.valueOf(v)));
    extendedInformation().ifPresent(v -> r.put(Attribute.extendedInformation, String.valueOf(v)));
    targetIndividualExtendedData()
        .ifPresent(v -> r.put(Attribute.targetIndividualExtendedData, String.valueOf(v)));
    restingState().ifPresent(v -> r.put(Attribute.restingState, String.valueOf(v)));
    existingTime().ifPresent(v -> r.put(Attribute.existingTime, String.valueOf(v)));
    return r;
  }
}
