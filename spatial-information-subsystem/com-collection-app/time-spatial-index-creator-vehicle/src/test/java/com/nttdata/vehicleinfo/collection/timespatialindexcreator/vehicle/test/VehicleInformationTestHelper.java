package com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.test;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.VehicleInformation;
import java.time.ZoneId;
import java.util.Optional;

public class VehicleInformationTestHelper {

  public static VehicleInformation createTestData(
      ZoneId zoneId, String id, double lon, double lat, double alt, long time) {
    return new VehicleInformation(
        zoneId,
        id,
        lon,
        lat,
        alt,
        time,
        "spatialId",
        "dataModelType",
        Optional.of("vehicleId"),
        Optional.of("vehicleName"),
        Optional.of("status"),
        "lat",
        "lng",
        "height",
        Optional.of("updatedAt"));
  }

  public static VehicleInformation createTestDataRequired(
      ZoneId zoneId, String id, double lon, double lat, double alt, long time) {
    return new VehicleInformation(
        zoneId,
        id,
        lon,
        lat,
        alt,
        time,
        "spatialId",
        "dataModelType",
        Optional.empty(),
        Optional.empty(),
        Optional.empty(),
        "lat",
        "lng",
        "height",
        Optional.empty());
  }
}
