package com.nttdata.vehicleinfo.space.search.controller;

import com.nttdata.vehicleinfo.space.search.api.TargetsApi;
import com.nttdata.vehicleinfo.space.search.axispot.SpatialId;
import com.nttdata.vehicleinfo.space.search.axispot.TargetAttributes;
import com.nttdata.vehicleinfo.space.search.model.TargetDetail;
import com.nttdata.vehicleinfo.space.search.model.TargetInfo;
import com.nttdata.vehicleinfo.space.search.model.TargetSpaceDetail;
import com.nttdata.vehicleinfo.space.search.service.ApiService;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.function.Consumer;
import jp.co.ntt.sic.MovingObjectStoreData;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 物標情報を検索するControllerクラス.<br>
 * インターフェースはOpenAPI Generatorにより自動生成されたものを継承する.
 */
@RestController
@RequestMapping("/cav/api/space/v1")
public class TargetsApiController implements TargetsApi {

  private final ApiService apiService;

  public TargetsApiController(@Qualifier("targetsApiService") ApiService apiService) {
    this.apiService = apiService;
  }

  /**
   * 指定された日時範囲内および空間IDリストに含まれる物標情報を返却します.<br>
   * 検索結果はリクエストされた空間IDリスト、日時順にソートされます.
   *
   * @param targetStartDateTime (required) 検索開始時刻
   * @param targetEndDateTime (required) 検索終了時刻
   * @param spatialID (required) 空間IDリスト
   * @return 検索結果を含んだレスポンス
   */
  @Override
  public ResponseEntity<TargetInfo> searchTargets(
      OffsetDateTime targetStartDateTime,
      OffsetDateTime targetEndDateTime,
      List<String> spatialID) {
    TargetInfo targetInfo = new TargetInfo();
    targetInfo.setTargetStartDateTime(targetStartDateTime);
    targetInfo.setTargetEndDateTime(targetEndDateTime);

    for (String spatialIdStr : spatialID) {
      SpatialId spatialId = SpatialId.parse(spatialIdStr);
      List<MovingObjectStoreData> results =
          apiService.searchObjects(targetStartDateTime, targetEndDateTime, spatialId);
      // createdAtでソートする
      // spatialIDはリクエストされた順を維持する
      results =
          results.stream()
              .sorted(Comparator.comparing(MovingObjectStoreData::getCreatedAt))
              .toList();
      for (MovingObjectStoreData result : results) {
        TargetSpaceDetail space = new TargetSpaceDetail();
        space.setSpatialID(spatialIdStr);
        space.setTargets(convertEntity(result));
        targetInfo.addSpacesItem(space);
      }
    }

    return new ResponseEntity<>(targetInfo, HttpStatus.OK);
  }

  private static TargetDetail convertEntity(MovingObjectStoreData data) {
    TargetDetail target = new TargetDetail();
    target.setSpatialID(data.getAttributes().get(TargetAttributes.SPATIAL_ID.getKey()));
    target.setTargetID(
        Long.parseLong(data.getAttributes().get(TargetAttributes.TARGET_ID.getKey())));
    target.setTime(data.getAttributes().get(TargetAttributes.TIME.getKey()));
    // 座標情報は指定の分解能の値を属性から取得する
    target.setLatitude(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.LATITUDE.getKey())));
    target.setLongitude(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.LONGITUDE.getKey())));
    target.setElevation(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.ELEVATION.getKey())));
    target.setPositionConf(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.POSITION_CONF.getKey())));
    target.setElevationConf(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.ELEVATION_CONF.getKey())));
    target.setSpeed(Integer.parseInt(data.getAttributes().get(TargetAttributes.SPEED.getKey())));
    target.setHeading(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.HEADING.getKey())));
    target.setAcceleration(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.ACCELERATION.getKey())));
    target.setSpeedConf(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.SPEED_CONF.getKey())));
    target.setHeadingConf(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.HEADING_CONF.getKey())));
    target.setForwardRearAccelerationConf(
        Integer.parseInt(
            data.getAttributes().get(TargetAttributes.FORWARD_REAR_ACCELERATION_CONF.getKey())));
    target.setSizeClassification(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.SIZE_CLASSIFICATION.getKey())));
    target.setRoleClassification(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.ROLE_CLASSIFICATION.getKey())));
    target.setVehicleWidth(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.VEHICLE_WIDTH.getKey())));
    target.setVehicleLength(
        Integer.parseInt(data.getAttributes().get(TargetAttributes.VEHICLE_LENGTH.getKey())));
    // 以下はOptionalな値であるため属性に含まれているときのみsetする
    setOptionalValue(
        target::setSemiMajorAxisOfPositionalErrorEllipse,
        data,
        TargetAttributes.SEMI_MAJOR_AXIS_OF_POSITIONAL_ERROR_ELLIPSE);
    setOptionalValue(
        target::setSemiMinorAxisOfPositionalErrorEllipse,
        data,
        TargetAttributes.SEMI_MINOR_AXIS_OF_POSITIONAL_ERROR_ELLIPSE);
    setOptionalValue(
        target::setSemiMajorAxisOrientationOfPositionalErrorEllipse,
        data,
        TargetAttributes.SEMI_MAJOR_AXIS_ORIENTATION_OF_POSITIONAL_ERROR_ELLIPSE);
    setOptionalValue(target::setGpSPositioningMode, data, TargetAttributes.GPS_POSITIONING_MODE);
    setOptionalValue(target::setGPSPDOP, data, TargetAttributes.GPS_PDOP);
    setOptionalValue(target::setRestingState, data, TargetAttributes.RESTING_STATE);
    return target;
  }

  private static void setOptionalValue(
      Consumer<Integer> setter, MovingObjectStoreData data, TargetAttributes attribute) {
    // キーが含まれていた場合キャストしてsetter関数を呼び出す
    if (data.getAttributes().containsKey(attribute.getKey())) {
      setter.accept(Integer.parseInt(data.getAttributes().get(attribute.getKey())));
    }
  }
}
