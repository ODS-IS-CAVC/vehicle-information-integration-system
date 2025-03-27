package com.nttdata.vehicleinfo.collection.targetinformationcollector.test;

import com.nttdata.vehicleinfo.collection.targetinformationcollector.parser.TargetInfoResponseParser;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class TargetInfoResponseParserTestHelper {

  public static final String DATA_DIR = "data/tier4-targetinfoapi/targetinfo";

  public static final String EXAMPLE_TARGET_DATE_TIME = "20240123000000";
  public static final String EXAMPLE_FILE_NAME = "targetinfo_16777215_12345678_20240123000000.json";
  public static final String TEST_TARGET_DATE_TIME = "20240124000000";
  public static final String TEST_FILE_NAME = "targetinfo_16777215_12345678_20240124000000.json";

  public static final String ZERO_TARGET_DATE_TIME = "zero";
  public static final String ZERO_FILE_NAME = "targetinfo_16777215_12345678_zero.json";
  public static final String REQUIRED_TARGET_DATE_TIME = "required";
  public static final String REQUIRED_FILE_NAME = "targetinfo_16777215_12345678_required.json";
  public static final String ILLEGAL_LOCATION_SPATIAL_ID_TARGET_DATE_TIME =
      "illegal_location_spatial_id";
  public static final String ILLEGAL_LOCATION_SPATIAL_ID_FILE_NAME =
      "targetinfo_16777215_12345678_illegal_location_spatial_id.json";
  public static final String ILLEGAL_LOCATION_AXISPOT_TARGET_DATE_TIME = "illegal_location_axispot";
  public static final String ILLEGAL_LOCATION_AXISPOT_FILE_NAME =
      "targetinfo_16777215_12345678_illegal_location_axispot.json";

  public static final String POST_NG_TARGET_DATE_TIME = "post_ng";
  public static final String POST_NG_FILE_NAME = "targetinfo_post_ng.json";
  public static final String POST_IOEXCEPTION_TARGET_DATE_TIME = "post_ioexception";
  public static final String POST_IOEXCEPTION_FILE_NAME = "targetinfo_post_ioexception.json";

  /**
   * 疎通確認用Exampleデータ（TargetInfoApiから取得したもの）
   *
   * @return
   */
  public static TargetInfoResponseParser getExample() {
    try {
      String body =
          Files.readString(getResourceDataDirAsPath(EXAMPLE_TARGET_DATE_TIME, EXAMPLE_FILE_NAME));
      return new TargetInfoResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  /**
   * 2024-01-24T00:00:00+09:00データ（テスト用につくったもの）
   *
   * @return
   */
  public static TargetInfoResponseParser get20240124000000() {
    try {
      String body =
          Files.readString(getResourceDataDirAsPath(TEST_TARGET_DATE_TIME, TEST_FILE_NAME));
      return new TargetInfoResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  /**
   * 物標情報0件データ（テスト用につくったもの）
   *
   * @return
   */
  public static TargetInfoResponseParser getZero() {
    try {
      String body =
          Files.readString(getResourceDataDirAsPath(ZERO_TARGET_DATE_TIME, ZERO_FILE_NAME));
      return new TargetInfoResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  /**
   * 物標情報必須のみデータ（テスト用につくったもの）
   *
   * @return
   */
  public static TargetInfoResponseParser getRequired() {
    try {
      String body =
          Files.readString(getResourceDataDirAsPath(REQUIRED_TARGET_DATE_TIME, REQUIRED_FILE_NAME));
      return new TargetInfoResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  /**
   * 物標情報位置範囲外データ（テスト用につくったもの）
   *
   * @return
   */
  public static TargetInfoResponseParser getIllegalLocationSpatialId() {
    try {
      String body =
          Files.readString(
              getResourceDataDirAsPath(
                  ILLEGAL_LOCATION_SPATIAL_ID_TARGET_DATE_TIME,
                  ILLEGAL_LOCATION_SPATIAL_ID_FILE_NAME));
      return new TargetInfoResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  /**
   * 物標情報位置範囲外データ（テスト用につくったもの）
   *
   * @return
   */
  public static TargetInfoResponseParser getIllegalLocationAxispot() {
    try {
      String body =
          Files.readString(
              getResourceDataDirAsPath(
                  ILLEGAL_LOCATION_AXISPOT_TARGET_DATE_TIME, ILLEGAL_LOCATION_AXISPOT_FILE_NAME));
      return new TargetInfoResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public static Path getResourceDataDirAsPath(String formattedTargetDatetime, String filePath) {
    return getResourceAsPath(Paths.get(DATA_DIR, formattedTargetDatetime, filePath).toString());
  }

  public static Path getResourceAsPath(String filePath) {
    try {
      Path path =
          Paths.get(
              MethodHandles.lookup().lookupClass().getClassLoader().getResource(filePath).toURI());
      return path;
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
