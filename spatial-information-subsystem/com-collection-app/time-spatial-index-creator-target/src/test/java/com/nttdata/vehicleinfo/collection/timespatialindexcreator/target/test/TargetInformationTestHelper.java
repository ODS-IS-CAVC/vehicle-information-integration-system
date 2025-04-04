package com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.test;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.TargetInformation;
import java.time.ZoneId;
import java.util.Optional;

public class TargetInformationTestHelper {

  public static TargetInformation createTestData(
      ZoneId zoneId, String id, double lon, double lat, double alt, long time) {
    return new TargetInformation(
        zoneId,
        id,
        lon,
        lat,
        alt,
        time,
        "spatialId",
        Optional.of("dataModelType"),
        100,
        0,
        "2024-01-23T01:23:45.678Z",
        1,
        101,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        Optional.of(10),
        true,
        "2024-01-23T01:23:45.678+09:00",
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        Optional.of(28),
        Optional.of(29),
        Optional.of(30),
        Optional.of(31),
        Optional.of(32),
        Optional.of(33),
        Optional.of(34),
        Optional.of(35),
        Optional.of(36),
        Optional.of(37),
        Optional.of(38),
        Optional.of(false),
        Optional.of(true),
        Optional.of(39),
        Optional.of(40),
        Optional.of(41),
        Optional.of(42),
        Optional.of(43),
        Optional.of(44),
        Optional.of(45),
        Optional.of(46),
        Optional.of(47),
        Optional.of(48),
        Optional.of(49),
        Optional.of(50),
        Optional.of(51),
        Optional.of(52),
        Optional.of(53),
        Optional.of(54),
        Optional.of(55),
        Optional.of(56),
        Optional.of(57),
        Optional.of("targetIndividualExtendedData"),
        Optional.of(58),
        Optional.of(59));
  }

  public static TargetInformation createTestDataRequired(
      ZoneId zoneId, String id, double lon, double lat, double alt, long time) {
    return new TargetInformation(
        zoneId,
        id,
        lon,
        lat,
        alt,
        time,
        "spatialId",
        Optional.empty(),
        100,
        0,
        "2024-01-23T01:23:45.678Z",
        1,
        101,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        Optional.empty(),
        true,
        "2024-01-23T01:23:45.678+09:00",
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        Optional.empty());
  }
}
