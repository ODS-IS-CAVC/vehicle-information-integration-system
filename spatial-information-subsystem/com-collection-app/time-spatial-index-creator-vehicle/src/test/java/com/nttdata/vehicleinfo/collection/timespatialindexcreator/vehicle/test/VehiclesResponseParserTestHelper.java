package com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.test;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.tier4.VehiclesResponseParser;
import java.lang.invoke.MethodHandles;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.ZoneId;

public class VehiclesResponseParserTestHelper {

  public static final String REQUIERD_FILE_NAME =
      "data/tier4-digitalzensoapi/vehicles/vehicles_required.json";
  public static final String ILLEGAL_LOCATION_SPATIAL_ID_FILE_NAME =
      "data/tier4-digitalzensoapi/vehicles/vehicles_illegal_location_spatial_id.json";
  public static final String ILLEGAL_LOCATION_AXISPOT_FILE_NAME =
      "data/tier4-digitalzensoapi/vehicles/vehicles_illegal_location_axispot.json";

  public static VehiclesResponseParser get20241119000000(
      ZoneId digitalZensoApiZoneId, ZoneId axispotZoneId) {
    return new VehiclesResponseParser(
        getResourceAsPath("data/tier4-digitalzensoapi/vehicles/vehicles_20241119000000.json"),
        digitalZensoApiZoneId,
        axispotZoneId);
  }

  public static VehiclesResponseParser get20241120090000(
      ZoneId digitalZensoApiZoneId, ZoneId axispotZoneId) {
    return new VehiclesResponseParser(
        getResourceAsPath("data/tier4-digitalzensoapi/vehicles/vehicles_20241120090000.json"),
        digitalZensoApiZoneId,
        axispotZoneId);
  }

  public static VehiclesResponseParser getZero(ZoneId digitalZensoApiZoneId, ZoneId axispotZoneId) {
    return new VehiclesResponseParser(
        getResourceAsPath("data/tier4-digitalzensoapi/vehicles/vehicles_zero.json"),
        digitalZensoApiZoneId,
        axispotZoneId);
  }

  /**
   * 車両情報必須データのみ（テスト用につくったもの）
   *
   * @param digitalZensoApiZoneId
   * @param axispotZoneId
   * @return
   */
  public static VehiclesResponseParser getRequired(
      ZoneId digitalZensoApiZoneId, ZoneId axispotZoneId) {
    return new VehiclesResponseParser(
        getResourceAsPath(REQUIERD_FILE_NAME), digitalZensoApiZoneId, axispotZoneId);
  }

  /**
   * 車両情報位置不正(空間ID）データのみ（テスト用につくったもの）
   *
   * @param digitalZensoApiZoneId
   * @param axispotZoneId
   * @return
   */
  public static VehiclesResponseParser getIllegalLocationSpatialId(
      ZoneId digitalZensoApiZoneId, ZoneId axispotZoneId) {
    return new VehiclesResponseParser(
        getResourceAsPath(ILLEGAL_LOCATION_SPATIAL_ID_FILE_NAME),
        digitalZensoApiZoneId,
        axispotZoneId);
  }

  /**
   * 車両情報位置不正(Axispot）データのみ（テスト用につくったもの）
   *
   * @param digitalZensoApiZoneId
   * @param axispotZoneId
   * @return
   */
  public static VehiclesResponseParser getIllegalLocationAxispot(
      ZoneId digitalZensoApiZoneId, ZoneId axispotZoneId) {
    return new VehiclesResponseParser(
        getResourceAsPath(ILLEGAL_LOCATION_AXISPOT_FILE_NAME),
        digitalZensoApiZoneId,
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
