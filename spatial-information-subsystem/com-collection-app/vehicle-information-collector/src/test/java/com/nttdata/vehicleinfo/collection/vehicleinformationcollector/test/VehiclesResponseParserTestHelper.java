package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.test;

import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.parser.VehiclesResponseParser;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class VehiclesResponseParserTestHelper {

  public static final String DATA_DIR = "data/tier4-digitalzensoapi/vehicles";

  public static final String REQUIRED_TARGET_DATE_TIME = "required";
  public static final String REQUIRED_FILE_NAME = "vehicles_required.json";
  public static final String ILLEGAL_LOCATION_SPATIAL_ID_TARGET_DATE_TIME =
      "illegal_location_spatial_id";
  public static final String ILLEGAL_LOCATION_SPATIAL_ID_FILE_NAME =
      "vehicles_illegal_location_spatial_id.json";
  public static final String ILLEGAL_LOCATION_AXISPOT_TARGET_DATE_TIME = "illegal_location_axispot";
  public static final String ILLEGAL_LOCATION_AXISPOT_FILE_NAME =
      "vehicles_illegal_location_axispot.json";

  public static VehiclesResponseParser get20241119000000() {
    try {
      String body =
          Files.readString(
              getResourceDataDirAsPath("20241119000000", "vehicles_20241119000000.json"));

      return new VehiclesResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public static VehiclesResponseParser get20241120090000() {
    try {
      String body =
          Files.readString(
              getResourceDataDirAsPath("20241120090000", "vehicles_20241120090000.json"));
      return new VehiclesResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public static VehiclesResponseParser getZero() {
    try {
      String body = Files.readString(getResourceDataDirAsPath("zero", "vehicles_zero.json"));
      return new VehiclesResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public static VehiclesResponseParser getRequired() {
    try {
      String body =
          Files.readString(getResourceDataDirAsPath(REQUIRED_TARGET_DATE_TIME, REQUIRED_FILE_NAME));
      return new VehiclesResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public static VehiclesResponseParser getIllegalLocationSpatialId() {
    try {
      String body =
          Files.readString(
              getResourceDataDirAsPath(
                  ILLEGAL_LOCATION_SPATIAL_ID_TARGET_DATE_TIME,
                  ILLEGAL_LOCATION_SPATIAL_ID_FILE_NAME));
      return new VehiclesResponseParser(body);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public static VehiclesResponseParser getIllegalLocationAxispot() {
    try {
      String body =
          Files.readString(
              getResourceDataDirAsPath(
                  ILLEGAL_LOCATION_AXISPOT_TARGET_DATE_TIME, ILLEGAL_LOCATION_AXISPOT_FILE_NAME));
      return new VehiclesResponseParser(body);
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
