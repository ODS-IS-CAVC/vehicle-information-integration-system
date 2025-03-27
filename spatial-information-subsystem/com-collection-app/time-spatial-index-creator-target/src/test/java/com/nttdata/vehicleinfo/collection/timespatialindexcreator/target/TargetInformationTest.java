package com.nttdata.vehicleinfo.collection.timespatialindexcreator.target;

import static org.junit.jupiter.api.Assertions.*;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.test.TargetInformationTestHelper;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class TargetInformationTest {

  @Test
  void toAttributes() {
    TargetInformation vehicleInformation =
        TargetInformationTestHelper.createTestData(null, "test", 1.1, 2.2, 3.3, 4);

    Map<String, String> actual = vehicleInformation.toAttributes();

    Map<String, String> expected = new HashMap<>();

    expected.put("spatialId", String.valueOf("spatialId"));
    expected.put("dataModelType", String.valueOf("dataModelType"));
    expected.put("serviceLocationID", String.valueOf(100));
    expected.put("roadsideUnitID", String.valueOf(0));
    expected.put("updateTimeInfo", String.valueOf("2024-01-23T01:23:45.678Z"));
    expected.put("formatVersion", String.valueOf(1));
    expected.put("deviceNum", String.valueOf(101));
    expected.put("deviceID", String.valueOf(2));
    expected.put("targetNum", String.valueOf(3));
    expected.put("commonServiceStandardID", String.valueOf(4));
    expected.put("targetMessageID", String.valueOf(5));
    expected.put("targetIndividualVersionInfo", String.valueOf(6));
    expected.put("targetID", String.valueOf(7));
    expected.put("targetIndividualIncrementCounter", String.valueOf(8));
    expected.put("dataLength", String.valueOf(9));
    expected.put("individualOptionFlag", String.valueOf(10));
    expected.put("leapSecondCorrectionInfo", String.valueOf(true));
    expected.put("time", String.valueOf("2024-01-23T01:23:45.678+09:00"));
    expected.put("latitude", String.valueOf(11));
    expected.put("longitude", String.valueOf(12));
    expected.put("elevation", String.valueOf(13));
    expected.put("positionConf", String.valueOf(14));
    expected.put("elevationConf", String.valueOf(15));
    expected.put("speed", String.valueOf(16));
    expected.put("heading", String.valueOf(17));
    expected.put("acceleration", String.valueOf(18));
    expected.put("speedConf", String.valueOf(19));
    expected.put("headingConf", String.valueOf(20));
    expected.put("forwardRearAccelerationConf", String.valueOf(21));
    expected.put("transmissionState", String.valueOf(22));
    expected.put("steeringWheelAngle", String.valueOf(23));
    expected.put("sizeClassification", String.valueOf(24));
    expected.put("roleClassification", String.valueOf(25));
    expected.put("vehicleWidth", String.valueOf(26));
    expected.put("vehicleLength", String.valueOf(27));
    expected.put("positionDelay", String.valueOf(28));
    expected.put("revisionCounter", String.valueOf(29));
    expected.put("roadFacilities", String.valueOf(30));
    expected.put("roadClassification", String.valueOf(31));
    expected.put("semiMajorAxisOfPositionalErrorEllipse", String.valueOf(32));
    expected.put("semiMinorAxisOfPositionalErrorEllipse", String.valueOf(33));
    expected.put("semiMajorAxisOrientationOfPositionalErrorEllipse", String.valueOf(34));
    expected.put("GPSPositioningMode", String.valueOf(35));
    expected.put("GPSPDOP", String.valueOf(36));
    expected.put("numberOfGPSSatellitesInUse", String.valueOf(37));
    expected.put("GPSMultiPathDetection", String.valueOf(38));
    expected.put("deadReckoningAvailability", String.valueOf(false));
    expected.put("mapMatchingAvailability", String.valueOf(true));
    expected.put("yawRate", String.valueOf(39));
    expected.put("brakeAppliedStatus", String.valueOf(40));
    expected.put("auxiliaryBrakeAppliedStatus", String.valueOf(41));
    expected.put("throttlePosition", String.valueOf(42));
    expected.put("exteriorLights", String.valueOf(43));
    expected.put("adaptiveCruiseControlStatus", String.valueOf(44));
    expected.put("cooperativeAdaptiveCruiseControlStatus", String.valueOf(45));
    expected.put("preCrashSafetyStatus", String.valueOf(46));
    expected.put("antilockBrakeStatus", String.valueOf(47));
    expected.put("tractionControlStatus", String.valueOf(48));
    expected.put("electronicStabilityControlStatus", String.valueOf(49));
    expected.put("laneKeepingAssistStatus", String.valueOf(50));
    expected.put("laneDepartureWarningStatus", String.valueOf(51));
    expected.put("intersectionDistanceInformationAvailability", String.valueOf(52));
    expected.put("intersectionDistance", String.valueOf(53));
    expected.put("intersectionPositionInformationAvailability", String.valueOf(54));
    expected.put("intersectionLatitude", String.valueOf(55));
    expected.put("intersectionLongitude", String.valueOf(56));
    expected.put("extendedInformation", String.valueOf(57));
    expected.put("targetIndividualExtendedData", String.valueOf("targetIndividualExtendedData"));
    expected.put("restingState", String.valueOf(58));
    expected.put("existingTime", String.valueOf(59));

    assertEquals(expected, actual);
  }
}
