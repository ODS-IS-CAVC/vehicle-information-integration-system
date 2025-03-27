package com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.test;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.tier4.TargetInfoResponseParser;
import java.lang.invoke.MethodHandles;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.ZoneId;

public class TargetInfoResponseParserTestHelper {
  public static final String EXAMPLE_FILE_NAME =
      "data/tier4-targetinfoapi/targetinfo/targetinfo_example.json";
  public static final String VALUE_CHECK_FILE_NAME =
      "data/tier4-targetinfoapi/targetinfo/targetinfo_value_check.json";
  public static final String ZERO_FILE_NAME =
      "data/tier4-targetinfoapi/targetinfo/targetinfo_zero.json";
  public static final String REQUIERD_FILE_NAME =
      "data/tier4-targetinfoapi/targetinfo/targetinfo_required.json";
  public static final String ILLEGAL_LOCATION_SPATIAL_ID_FILE_NAME =
      "data/tier4-targetinfoapi/targetinfo/targetinfo_illegal_location_spatial_id.json";
  public static final String ILLEGAL_LOCATION_AXISPOT_FILE_NAME =
      "data/tier4-targetinfoapi/targetinfo/targetinfo_illegal_location_axispot.json";

  /**
   * 疎通確認用Exampleデータ（TargetInfoApiから取得したもの）
   *
   * @param targetInfoApiZoneId
   * @param axispotZoneId
   * @return
   */
  public static TargetInfoResponseParser getExample(
      ZoneId targetInfoApiZoneId, ZoneId axispotZoneId) {
    return new TargetInfoResponseParser(
        getResourceAsPath(EXAMPLE_FILE_NAME), targetInfoApiZoneId, axispotZoneId);
  }

  /**
   * 値確認用データ（テスト用につくったもの）
   *
   * @param targetInfoApiZoneId
   * @param axispotZoneId
   * @return
   */
  public static TargetInfoResponseParser getValueCheck(
      ZoneId targetInfoApiZoneId, ZoneId axispotZoneId) {
    return new TargetInfoResponseParser(
        getResourceAsPath(VALUE_CHECK_FILE_NAME), targetInfoApiZoneId, axispotZoneId);
  }

  /**
   * 物標情報0件データ（テスト用につくったもの）
   *
   * @param targetInfoApiZoneId
   * @param axispotZoneId
   * @return
   */
  public static TargetInfoResponseParser getZero(ZoneId targetInfoApiZoneId, ZoneId axispotZoneId) {
    return new TargetInfoResponseParser(
        getResourceAsPath(ZERO_FILE_NAME), targetInfoApiZoneId, axispotZoneId);
  }

  /**
   * 物標情報必須データのみ（テスト用につくったもの）
   *
   * @param targetInfoApiZoneId
   * @param axispotZoneId
   * @return
   */
  public static TargetInfoResponseParser getRequired(
      ZoneId targetInfoApiZoneId, ZoneId axispotZoneId) {
    return new TargetInfoResponseParser(
        getResourceAsPath(REQUIERD_FILE_NAME), targetInfoApiZoneId, axispotZoneId);
  }

  /**
   * 物標情報位置不正(空間ID）データのみ（テスト用につくったもの）
   *
   * @param targetInfoApiZoneId
   * @param axispotZoneId
   * @return
   */
  public static TargetInfoResponseParser getIllegalLocationSpatialId(
      ZoneId targetInfoApiZoneId, ZoneId axispotZoneId) {
    return new TargetInfoResponseParser(
        getResourceAsPath(ILLEGAL_LOCATION_SPATIAL_ID_FILE_NAME),
        targetInfoApiZoneId,
        axispotZoneId);
  }

  /**
   * 物標情報位置不正(Axispot）データのみ（テスト用につくったもの）
   *
   * @param targetInfoApiZoneId
   * @param axispotZoneId
   * @return
   */
  public static TargetInfoResponseParser getIllegalLocationAxispot(
      ZoneId targetInfoApiZoneId, ZoneId axispotZoneId) {
    return new TargetInfoResponseParser(
        getResourceAsPath(ILLEGAL_LOCATION_AXISPOT_FILE_NAME), targetInfoApiZoneId, axispotZoneId);
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
