package com.nttdata.vehicleinfo.space.search.controller;

import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;

import com.nttdata.vehicleinfo.space.search.api.VehiclesApi;
import com.nttdata.vehicleinfo.space.search.axispot.SpatialId;
import com.nttdata.vehicleinfo.space.search.axispot.VehicleAttributes;
import com.nttdata.vehicleinfo.space.search.model.VehicleProbeDetail;
import com.nttdata.vehicleinfo.space.search.model.VehicleProbeInfo;
import com.nttdata.vehicleinfo.space.search.model.VehicleSpaceDetail;
import com.nttdata.vehicleinfo.space.search.model.VehicleStatus;
import com.nttdata.vehicleinfo.space.search.service.ApiService;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import jp.co.ntt.sic.MovingObjectStoreData;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 車両情報を検索するControllerクラス.<br>
 * インターフェースはOpenAPI Generatorにより自動生成されたものを継承する.
 */
@RestController
@RequestMapping("/cav/api/space/v1")
public class VehiclesApiController implements VehiclesApi {

  private final ApiService apiService;

  public VehiclesApiController(@Qualifier("vehiclesApiService") ApiService apiService) {
    this.apiService = apiService;
  }

  /**
   * 指定された日時範囲内および空間IDリストに含まれる車両情報を返却します. 検索結果はリクエストされた空間IDリスト、日時順にソートされます.
   *
   * @param targetStartDateTime (required) 検索開始時刻
   * @param targetEndDateTime (required) 検索終了時刻
   * @param spatialID (required) 空間IDリスト
   * @return 検索結果を含んだレスポンス
   */
  @Override
  public ResponseEntity<VehicleProbeInfo> searchVehicles(
      OffsetDateTime targetStartDateTime,
      OffsetDateTime targetEndDateTime,
      List<String> spatialID) {

    VehicleProbeInfo vehicleProbeInfo = new VehicleProbeInfo();
    vehicleProbeInfo.setTargetStartDateTime(targetStartDateTime);
    vehicleProbeInfo.setTargetEndDateTime(targetEndDateTime);
    for (String spatialIdStr : spatialID) {
      SpatialId spatial = SpatialId.parse(spatialIdStr);
      List<MovingObjectStoreData> results =
          apiService.searchObjects(targetStartDateTime, targetEndDateTime, spatial);
      // createdAtでソートする
      // spatialIDはリクエストされた順を維持する
      results =
          results.stream()
              .sorted(Comparator.comparing(MovingObjectStoreData::getCreatedAt))
              .toList();
      for (MovingObjectStoreData result : results) {
        VehicleSpaceDetail vehicleSpaceDetail = new VehicleSpaceDetail();
        vehicleSpaceDetail.setSpatialID(spatialIdStr);
        vehicleSpaceDetail.setVehicles(convertEntity(result));
        vehicleProbeInfo.addSpacesItem(vehicleSpaceDetail);
      }
    }
    return new ResponseEntity<>(vehicleProbeInfo, HttpStatus.OK);
  }

  private static VehicleProbeDetail convertEntity(MovingObjectStoreData data) {
    VehicleProbeDetail probe = new VehicleProbeDetail();
    probe.setVehicleID(
        UUID.fromString(data.getAttributes().get(VehicleAttributes.VEHICLE_ID.getKey())));
    probe.setVehicleName(data.getAttributes().get(VehicleAttributes.VEHICLE_NAME.getKey()));
    probe.setStatus(
        VehicleStatus.fromValue(data.getAttributes().get(VehicleAttributes.STATUS.getKey())));
    probe.setSpatialID(data.getAttributes().get(VehicleAttributes.SPATIAL_ID.getKey()));
    // getCoordにはlon, lat, altの順で格納されている
    probe.setLon(data.getCoord().x);
    probe.setLat(data.getCoord().y);
    // 高度情報は属性データを利用する
    probe.setHeight(
        Double.parseDouble(data.getAttributes().get(VehicleAttributes.HEIGHT.getKey())));
    probe.setUpdatedAt(
        OffsetDateTime.parse(
            data.getAttributes().get(VehicleAttributes.UPDATED_AT.getKey()), ISO_OFFSET_DATE_TIME));
    return probe;
  }
}
