package com.nttdata.vehicleinfo.collection.weatherinformationcollector.test;

import com.nttdata.vehicleinfo.collection.weatherinformationcollector.parser.Wimage72ResponseParser;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class Wimage72ResponseParserTestHelper {

  public static final String DATA_DIR = "data/halex-dreamapi/wimage72-service";

  public static final String TARGET_DATE_TIME_202409040000 = "202409040000";
  public static final String FILE_NAME_202409040000_1 = "lat35.73243_lon139.71547.json";

  public static final String ILLEGAL_LOCATION_OK_00H_FILE_NAME = "lat35.73243_lon139.71547.json";
  public static final String ILLEGAL_LOCATION_SPATIAL_ID_TARGET_DATE_TIME =
      "illegal_location_spatial_id/202409040000";
  public static final String ILLEGAL_LOCATION_SPATIAL_ID_FILE_NAME = "lat-90.0_lon139.71547.json";
  public static final String ILLEGAL_LOCATION_AXISPOT_TARGET_DATE_TIME =
      "illegal_location_axispot/202409040000";
  public static final String ILLEGAL_LOCATION_AXISPOT_FILE_NAME =
      "lat-85.0511287_lon139.71547.json";

  public static Wimage72ResponseParser getWimage72Response202409040000() {
    try {
      String body =
          Files.readString(
              getResourceDataDirAsPath(TARGET_DATE_TIME_202409040000, FILE_NAME_202409040000_1));
      return new Wimage72ResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public static Wimage72ResponseParser getWimage72ResponseRetryableError() {
    // ERR-014のみリトライする
    return new Wimage72ResponseParser("{\"error\":\"ERR-014 APIセンターサーバ側内部にて例外等の事象発生\"}");
  }

  public static Wimage72ResponseParser getWimage72ResponseError() {
    // ERR-014以外はリトライしない
    return new Wimage72ResponseParser("{\"error\":\"ERR-101 省略不可リクエストパラメータ不足\"}");
  }

  public static Wimage72ResponseParser getIllegalLocationSpatialId() {
    try {
      String body =
          Files.readString(
              getResourceDataDirAsPath(
                  ILLEGAL_LOCATION_SPATIAL_ID_TARGET_DATE_TIME,
                  ILLEGAL_LOCATION_SPATIAL_ID_FILE_NAME));
      return new Wimage72ResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public static Wimage72ResponseParser getIllegalLocationSpatialIdOk00h() {
    try {
      String body =
          Files.readString(
              getResourceDataDirAsPath(
                  ILLEGAL_LOCATION_SPATIAL_ID_TARGET_DATE_TIME, ILLEGAL_LOCATION_OK_00H_FILE_NAME));
      return new Wimage72ResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public static Wimage72ResponseParser getIllegalLocationAxispot() {
    try {
      String body =
          Files.readString(
              getResourceDataDirAsPath(
                  ILLEGAL_LOCATION_AXISPOT_TARGET_DATE_TIME, ILLEGAL_LOCATION_AXISPOT_FILE_NAME));
      return new Wimage72ResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public static Wimage72ResponseParser getIllegalLocationAxispotOk00h() {
    try {
      String body =
          Files.readString(
              getResourceDataDirAsPath(
                  ILLEGAL_LOCATION_AXISPOT_TARGET_DATE_TIME, ILLEGAL_LOCATION_OK_00H_FILE_NAME));
      return new Wimage72ResponseParser(body);
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
