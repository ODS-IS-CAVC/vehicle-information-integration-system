package com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle;

import static org.junit.jupiter.api.Assertions.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;

class VehicleInformationTest {

  @Test
  void toAttributes() {
    VehicleInformation vehicleInformation =
        new VehicleInformation(
            null,
            "test",
            1.1,
            2.2,
            3.3,
            4,
            "spatialId",
            "dataModelType",
            Optional.of("vehicleId"),
            Optional.of("vehicleName"),
            Optional.of("status"),
            "lat",
            "lng",
            "height",
            Optional.of("updatedAt"));

    Map<String, String> actual = vehicleInformation.toAttributes();

    Map<String, String> expected = new HashMap<>();

    expected.put(VehicleInformation.Attribute.spatialId, "spatialId");
    expected.put(VehicleInformation.Attribute.dataModelType, "dataModelType");
    expected.put(VehicleInformation.Attribute.vehicleId, "vehicleId");
    expected.put(VehicleInformation.Attribute.vehicleName, "vehicleName");
    expected.put(VehicleInformation.Attribute.status, "status");
    expected.put(VehicleInformation.Attribute.lat, "lat");
    expected.put(VehicleInformation.Attribute.lng, "lng");
    expected.put(VehicleInformation.Attribute.height, "height");
    expected.put(VehicleInformation.Attribute.updatedAt, "updatedAt");

    assertEquals(expected, actual);
  }
}
