package com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.tier4;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.TargetInformation;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.test.TargetInfoResponseParserTestHelper;
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
import java.util.Optional;
import org.junit.jupiter.api.Test;

class TargetInfoResponseParserTest {

  /** JST */
  private final ZoneId JST = ZoneId.of("Asia/Tokyo");

  /** UTC */
  private final ZoneId UTC = ZoneId.of("UTC");

  @Test
  void constructor_NG() {
    // nullの場合はIllegalArgumentExceptionが発生すること
    assertThrows(
        IllegalArgumentException.class, () -> new TargetInfoResponseParser(null, UTC, UTC));
    // 存在しないファイルの場合はIllegalArgumentExceptionが発生すること
    assertThrows(
        IllegalArgumentException.class,
        () -> new TargetInfoResponseParser(Path.of("NOT_EXISTS"), UTC, UTC));
    // ファイルではない場合はIllegalArgumentExceptionが発生すること
    assertThrows(
        IllegalArgumentException.class, () -> new TargetInfoResponseParser(Path.of(""), UTC, UTC));
  }

  @Test
  void toTargetInformationList() {
    // targets_zero.jsonは0件であること
    TargetInfoResponseParser resZero = TargetInfoResponseParserTestHelper.getZero(UTC, UTC);
    List<TargetInformation> listZero = resZero.toTargetInformationList();
    assertEquals(0, listZero.size());

    // Exampleは6件であること
    TargetInfoResponseParser resExample = TargetInfoResponseParserTestHelper.getExample(UTC, UTC);
    List<TargetInformation> listExample = resExample.toTargetInformationList();
    assertEquals(6, listExample.size());

    // ValueCheckは2件であること
    TargetInfoResponseParser resValueCheck =
        TargetInfoResponseParserTestHelper.getValueCheck(UTC, UTC);
    List<TargetInformation> listValueCheck = resValueCheck.toTargetInformationList();
    assertEquals(2, listValueCheck.size());

    // ValueCheckの1件目の値が正しく変換されていること
    TargetInformation infoValueCheck = listValueCheck.getFirst();
    assertEquals(UTC, infoValueCheck.zoneId());
    assertEquals(Optional.of("dataModelType"), infoValueCheck.dataModelType());
    assertEquals(100L, infoValueCheck.serviceLocationID());
    assertEquals(0L, infoValueCheck.roadsideUnitID());
    assertEquals("2024-01-24T00:00:00.00Z", infoValueCheck.updateTimeInfo());
    assertEquals(1, infoValueCheck.formatVersion());
    assertEquals(101, infoValueCheck.deviceNum());
    assertEquals(2, infoValueCheck.deviceID());
    assertEquals(3, infoValueCheck.targetNum());
    assertEquals(4, infoValueCheck.commonServiceStandardID());
    assertEquals(5, infoValueCheck.targetMessageID());
    assertEquals(6, infoValueCheck.targetIndividualVersionInfo());
    assertEquals(7, infoValueCheck.targetID());
    assertEquals(8, infoValueCheck.targetIndividualIncrementCounter());
    assertEquals(9, infoValueCheck.dataLength());
    assertEquals(Optional.of(10), infoValueCheck.individualOptionFlag());
    assertEquals(true, infoValueCheck.leapSecondCorrectionInfo());
    assertEquals("2024-01-24T00:00:00.00+09:00", infoValueCheck.targetIndividualInfoTime());
    assertEquals(11, infoValueCheck.targetIndividualInfoLatitude());
    assertEquals(12, infoValueCheck.targetIndividualInfoLongitude());
    assertEquals(13, infoValueCheck.elevation());
    assertEquals(14, infoValueCheck.positionConf());
    assertEquals(15, infoValueCheck.elevationConf());
    assertEquals(16, infoValueCheck.speed());
    assertEquals(17, infoValueCheck.heading());
    assertEquals(18, infoValueCheck.acceleration());
    assertEquals(19, infoValueCheck.speedConf());
    assertEquals(20, infoValueCheck.headingConf());
    assertEquals(21, infoValueCheck.forwardRearAccelerationConf());
    assertEquals(22, infoValueCheck.transmissionState());
    assertEquals(23, infoValueCheck.steeringWheelAngle());
    assertEquals(24, infoValueCheck.sizeClassification());
    assertEquals(25, infoValueCheck.roleClassification());
    assertEquals(26, infoValueCheck.vehicleWidth());
    assertEquals(27, infoValueCheck.vehicleLength());
    assertEquals(Optional.of(28), infoValueCheck.positionDelay());
    assertEquals(Optional.of(29), infoValueCheck.revisionCounter());
    assertEquals(Optional.of(30), infoValueCheck.roadFacilities());
    assertEquals(Optional.of(31), infoValueCheck.roadClassification());
    assertEquals(Optional.of(32), infoValueCheck.semiMajorAxisOfPositionalErrorEllipse());
    assertEquals(Optional.of(33), infoValueCheck.semiMinorAxisOfPositionalErrorEllipse());
    assertEquals(
        Optional.of(34), infoValueCheck.semiMajorAxisOrientationOfPositionalErrorEllipse());
    assertEquals(Optional.of(35), infoValueCheck.GPSPositioningMode());
    assertEquals(Optional.of(36), infoValueCheck.GPSPDOP());
    assertEquals(Optional.of(37), infoValueCheck.numberOfGPSSatellitesInUse());
    assertEquals(Optional.of(38), infoValueCheck.GPSMultiPathDetection());
    assertEquals(Optional.of(false), infoValueCheck.deadReckoningAvailability());
    assertEquals(Optional.of(true), infoValueCheck.mapMatchingAvailability());
    assertEquals(Optional.of(39), infoValueCheck.yawRate());
    assertEquals(Optional.of(40), infoValueCheck.brakeAppliedStatus());
    assertEquals(Optional.of(41), infoValueCheck.auxiliaryBrakeAppliedStatus());
    assertEquals(Optional.of(42), infoValueCheck.throttlePosition());
    assertEquals(Optional.of(43), infoValueCheck.exteriorLights());
    assertEquals(Optional.of(44), infoValueCheck.adaptiveCruiseControlStatus());
    assertEquals(Optional.of(45), infoValueCheck.cooperativeAdaptiveCruiseControlStatus());
    assertEquals(Optional.of(46), infoValueCheck.preCrashSafetyStatus());
    assertEquals(Optional.of(47), infoValueCheck.antilockBrakeStatus());
    assertEquals(Optional.of(48), infoValueCheck.tractionControlStatus());
    assertEquals(Optional.of(49), infoValueCheck.electronicStabilityControlStatus());
    assertEquals(Optional.of(50), infoValueCheck.laneKeepingAssistStatus());
    assertEquals(Optional.of(51), infoValueCheck.laneDepartureWarningStatus());
    assertEquals(Optional.of(52), infoValueCheck.intersectionDistanceInformationAvailability());
    assertEquals(Optional.of(53), infoValueCheck.intersectionDistance());
    assertEquals(Optional.of(54), infoValueCheck.intersectionPositionInformationAvailability());
    assertEquals(Optional.of(55), infoValueCheck.intersectionLatitude());
    assertEquals(Optional.of(56), infoValueCheck.intersectionLongitude());
    assertEquals(Optional.of(57), infoValueCheck.extendedInformation());
    assertEquals(
        Optional.of("targetIndividualExtendedData"), infoValueCheck.targetIndividualExtendedData());
    assertEquals(Optional.of(58), infoValueCheck.restingState());
    assertEquals(Optional.of(59), infoValueCheck.existingTime());

    // AxispotのidにはtargetIDを設定していること
    assertEquals("7", infoValueCheck.id());

    // Axispotのtimeに設定するエポック秒をTargetInfoのtimeから算出する（TargetInfoのtimeはISO8601形式を想定）
    assertEquals(
        ZonedDateTime.parse("2024-01-24T00:00:00.00+09:00", DateTimeFormatter.ISO_OFFSET_DATE_TIME)
            .withZoneSameInstant(UTC)
            .toEpochSecond(),
        infoValueCheck.time());

    // TargetInfoの経度、緯度は整数のため小数に変換する
    assertEquals(0.0000011, infoValueCheck.latitude(), 0.0);
    assertEquals(0.0000012, infoValueCheck.longitude(), 0.0);
    assertEquals(1.3, infoValueCheck.altitude(), 0.0);

    // 空間IDの期待値はウラノスGEX 4次元時空間情報基盤用 共通ライブラリ(Python版)にて算出
    // SpatialId.shape.point.f_get_spatial_ids_on_points([SpatialId.common.object.point.Point(0.0000012, 0.0000011, 1.3)], 25, 4326)
    // ['25/1/16777216/16777215']
    assertEquals("25/1/16777216/16777215", infoValueCheck.spatialId());
  }

  @Test
  void toTargetInformationList_required() {
    // targets_required.jsonは1件であること
    TargetInfoResponseParser resRequired = TargetInfoResponseParserTestHelper.getRequired(UTC, UTC);
    List<TargetInformation> listRequired = resRequired.toTargetInformationList();
    assertEquals(1, listRequired.size());
  }

  @Test
  void toTargetInformationList_illegal_location_spatial_id() {
    // 空間IDの変換に失敗するためtargetinfo_illegal_location_spatial_id.jsonは0件であること
    TargetInfoResponseParser resIllegalSpatialId =
        TargetInfoResponseParserTestHelper.getIllegalLocationSpatialId(UTC, UTC);
    List<TargetInformation> listIllegalSpatialId = resIllegalSpatialId.toTargetInformationList();
    assertEquals(0, listIllegalSpatialId.size());
  }

  @Test
  void toTargetInformationList_illegal_location_axispot() {
    // 空間IDの変換は成功するためtargetinfo_illegal_location_axispot.jsonは1件であること
    TargetInfoResponseParser resIllegalAxispot =
        TargetInfoResponseParserTestHelper.getIllegalLocationAxispot(UTC, UTC);
    List<TargetInformation> listIllegalAxispot = resIllegalAxispot.toTargetInformationList();
    assertEquals(1, listIllegalAxispot.size());
  }

  @Test
  void initJson() throws URISyntaxException, IOException {
    // Example用データで初期化した後に値確認用データでinitJson()を呼び出すと上書きされること
    TargetInfoResponseParser res = TargetInfoResponseParserTestHelper.getExample(UTC, UTC);
    Path inputFilePath =
        Paths.get(
            getClass()
                .getClassLoader()
                .getResource(TargetInfoResponseParserTestHelper.VALUE_CHECK_FILE_NAME)
                .toURI());
    res.initJson(inputFilePath);
    String expectedInputJson = Files.readString(inputFilePath, StandardCharsets.UTF_8);
    Map expectedInputMap = new ObjectMapper().readValue(expectedInputJson, Map.class);
    assertEquals(expectedInputJson, res.getInputJson());
    assertEquals(expectedInputMap, res.getInputMap());

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
