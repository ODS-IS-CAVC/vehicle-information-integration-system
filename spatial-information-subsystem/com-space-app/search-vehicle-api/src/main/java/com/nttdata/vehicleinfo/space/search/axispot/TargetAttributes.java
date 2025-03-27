package com.nttdata.vehicleinfo.space.search.axispot;

/** Axispotに格納されている物標情報データが保持する属性情報のキー一覧. */
public enum TargetAttributes implements StoreDataAttribute {

  /** 空間ID(ズームレベル25相当) */
  SPATIAL_ID("spatialId"),
  /** 物標ID */
  TARGET_ID("targetID"),
  /**
   * 時刻<br>
   * 更新日時としても扱う.
   */
  // 時刻情報(ex. 2024-01-23T01:23:45.678+09:00)
  TIME("time"),
  /** 経度(分解能あり) */
  LATITUDE("latitude"),
  /** 緯度(分解能あり) */
  LONGITUDE("longitude"),
  ELEVATION("elevation"),
  ELEVATION_CONF("elevationConf"),
  POSITION_CONF("positionConf"),
  SPEED("speed"),
  HEADING("heading"),
  ACCELERATION("acceleration"),
  SPEED_CONF("speedConf"),
  HEADING_CONF("headingConf"),
  FORWARD_REAR_ACCELERATION_CONF("forwardRearAccelerationConf"),
  SIZE_CLASSIFICATION("sizeClassification"),
  ROLE_CLASSIFICATION("roleClassification"),
  VEHICLE_WIDTH("vehicleWidth"),
  VEHICLE_LENGTH("vehicleLength"),
  SEMI_MAJOR_AXIS_OF_POSITIONAL_ERROR_ELLIPSE("semiMajorAxisOfPositionalErrorEllipse"),
  SEMI_MINOR_AXIS_OF_POSITIONAL_ERROR_ELLIPSE("semiMinorAxisOfPositionalErrorEllipse"),
  SEMI_MAJOR_AXIS_ORIENTATION_OF_POSITIONAL_ERROR_ELLIPSE(
      "semiMajorAxisOrientationOfPositionalErrorEllipse"),
  GPS_POSITIONING_MODE("GPSPositioningMode"),
  GPS_PDOP("GPSPDOP"),
  RESTING_STATE("restingState");

  private final String key;

  TargetAttributes(String key) {
    this.key = key;
  }

  public String getKey() {
    return key;
  }
}
