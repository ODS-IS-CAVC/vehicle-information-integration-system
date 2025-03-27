package com.nttdata.vehicleinfo.space.search;

import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;

import com.nttdata.vehicleinfo.space.search.axispot.TargetAttributes;
import com.nttdata.vehicleinfo.space.search.axispot.VehicleAttributes;
import com.nttdata.vehicleinfo.space.search.model.VehicleStatus;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import jp.co.ntt.sic.Geotemp;
import jp.co.ntt.sic.MovingObjectKey;
import jp.co.ntt.sic.MovingObjectRawData;
import jp.co.ntt.sic.MovingObjectValue;
import org.locationtech.jts.geom.Coordinate;

public class TestUtils {

  public static void setDataToVehicle(
      Geotemp geotemp,
      String spatialId,
      OffsetDateTime time,
      double longitude,
      double latitude,
      double altitude,
      UUID vehicleId,
      OffsetDateTime updatedAt) {
    MovingObjectKey key =
        new MovingObjectKey(time.toEpochSecond(), longitude, latitude, altitude, "testVehicle");
    // vehicleId, updatedAt以外はダミー値を入力
    MovingObjectValue value =
        new MovingObjectValue(
            new Coordinate(longitude, latitude, altitude),
            Timestamp.from(time.toInstant()),
            Map.of(
                VehicleAttributes.UPDATED_AT.getKey(), ISO_OFFSET_DATE_TIME.format(updatedAt),
                VehicleAttributes.SPATIAL_ID.getKey(), spatialId,
                VehicleAttributes.VEHICLE_ID.getKey(), vehicleId.toString(),
                VehicleAttributes.VEHICLE_NAME.getKey(), "vehicleName",
                VehicleAttributes.STATUS.getKey(), VehicleStatus.READY.getValue(),
                VehicleAttributes.HEIGHT.getKey(), String.valueOf(altitude)));
    MovingObjectRawData data = new MovingObjectRawData(key, value);
    geotemp.set(data);
  }

  public static void setDataToTarget(
      Geotemp geotemp,
      String spatialId,
      OffsetDateTime time,
      double longitude,
      double latitude,
      double altitude,
      long targetId,
      OffsetDateTime updatedAt) {
    MovingObjectKey key =
        new MovingObjectKey(time.toEpochSecond(), longitude, latitude, altitude, "testVehicle");
    MovingObjectValue value =
        new MovingObjectValue(
            new Coordinate(longitude, latitude, altitude),
            Timestamp.from(time.toInstant()),
            // 空間ID、物標情報ID、time以外はダミー値を設定
            // Optionalなデータは一部省略する(ここではGPS_PDOPを省略)
            Map.ofEntries(
                Map.entry(TargetAttributes.SPATIAL_ID.getKey(), spatialId),
                Map.entry(TargetAttributes.TARGET_ID.getKey(), String.valueOf(targetId)),
                Map.entry(TargetAttributes.TIME.getKey(), ISO_OFFSET_DATE_TIME.format(updatedAt)),
                Map.entry(TargetAttributes.LATITUDE.getKey(), "1"),
                Map.entry(TargetAttributes.LONGITUDE.getKey(), "1"),
                Map.entry(TargetAttributes.ELEVATION.getKey(), "1"),
                Map.entry(TargetAttributes.POSITION_CONF.getKey(), "1"),
                Map.entry(TargetAttributes.ELEVATION_CONF.getKey(), "1"),
                Map.entry(TargetAttributes.SPEED.getKey(), "1"),
                Map.entry(TargetAttributes.HEADING.getKey(), "1"),
                Map.entry(TargetAttributes.ACCELERATION.getKey(), "1"),
                Map.entry(TargetAttributes.SPEED_CONF.getKey(), "1"),
                Map.entry(TargetAttributes.HEADING_CONF.getKey(), "1"),
                Map.entry(TargetAttributes.FORWARD_REAR_ACCELERATION_CONF.getKey(), "1"),
                Map.entry(TargetAttributes.SIZE_CLASSIFICATION.getKey(), "1"),
                Map.entry(TargetAttributes.ROLE_CLASSIFICATION.getKey(), "1"),
                Map.entry(TargetAttributes.VEHICLE_WIDTH.getKey(), "1"),
                Map.entry(TargetAttributes.VEHICLE_LENGTH.getKey(), "1"),
                Map.entry(
                    TargetAttributes.SEMI_MAJOR_AXIS_OF_POSITIONAL_ERROR_ELLIPSE.getKey(), "1"),
                Map.entry(
                    TargetAttributes.SEMI_MINOR_AXIS_OF_POSITIONAL_ERROR_ELLIPSE.getKey(), "1"),
                Map.entry(
                    TargetAttributes.SEMI_MAJOR_AXIS_ORIENTATION_OF_POSITIONAL_ERROR_ELLIPSE
                        .getKey(),
                    "1"),
                Map.entry(TargetAttributes.GPS_POSITIONING_MODE.getKey(), "1"),
                Map.entry(TargetAttributes.RESTING_STATE.getKey(), "1")));
    MovingObjectRawData data = new MovingObjectRawData(key, value);
    geotemp.set(data);
  }
}
