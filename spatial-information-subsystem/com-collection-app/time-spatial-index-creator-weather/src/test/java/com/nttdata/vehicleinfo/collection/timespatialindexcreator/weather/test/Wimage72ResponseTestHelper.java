package com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.test;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.halex.Wimage72ResponseParser;
import java.lang.invoke.MethodHandles;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.ZoneId;

public class Wimage72ResponseTestHelper {

  public static final String ILLEGAL_LOCATION_SPATIAL_ID_FILE_NAME =
      "data/halex-dreamapi/wimage72-service/illegal_location_spatial_id/202409040000/lat-90.0_lon139.71547.json";
  public static final String ILLEGAL_LOCATION_AXISPOT_FILE_NAME =
      "data/halex-dreamapi/wimage72-service/illegal_location_axispot/202409040000/lat-85.0511287_lon139.71547.json";

  public static Wimage72ResponseParser get202409040000(
      ZoneId dreamApiWimage72ZoneId, ZoneId axispotZoneId) {
    return new Wimage72ResponseParser(
        getResourceAsPath(
            "data/halex-dreamapi/wimage72-service/202409040000/lat35.73243_lon139.71547.json"),
        dreamApiWimage72ZoneId,
        axispotZoneId);
  }

  public static Wimage72ResponseParser get202409042300(
      ZoneId dreamApiWimage72ZoneId, ZoneId axispotZoneId) {
    return new Wimage72ResponseParser(
        getResourceAsPath(
            "data/halex-dreamapi/wimage72-service/202409042300/lat35.73243_lon139.71547.json"),
        dreamApiWimage72ZoneId,
        axispotZoneId);
  }

  public static Path getResourceAsPath(String name) {
    try {
      Path path =
          Paths.get(
              MethodHandles.lookup().lookupClass().getClassLoader().getResource(name).toURI());
      return path;
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
