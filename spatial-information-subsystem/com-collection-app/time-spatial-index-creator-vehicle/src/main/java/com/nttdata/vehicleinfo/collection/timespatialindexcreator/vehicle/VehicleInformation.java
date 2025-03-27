package com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle;

import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 車両情報
 *
 * @param zoneId Axispotタイムゾーン。現在は未使用。
 * @param id 識別子。AxispotのMovingObjectStoreData.getMovingObjectId()に対応する。
 * @param longitude 経度。時空間インデックスの算出に用いる経度と同じ値を設定する。AxispotのMovingObjectStoreData.getCoord().xに対応する。
 * @param latitude 緯度。時空間インデックスの算出に用いる緯度と同じ値を設定する。AxispotのMovingObjectStoreData.getCoord().yに対応する。
 * @param altitude 高度。時空間インデックスの算出に用いる高度と同じ値を設定する。AxispotのMovingObjectStoreData.getCoord().zに対応する。
 * @param time
 *     時間（エポック秒）。時空間インデックスの算出に用いる時間と同じ値を設定する。AxispotのMovingObjectStoreData.getCreatedAt()に対応する。
 * @param spatialId
 *     空間ID（ズームレベル25）。AxispotのMovingObjectStoreData.getAttributes().get("spatialId")に対応する。
 * @param dataModelType
 *     データモデルタイプ。AxispotのMovingObjectStoreData.getAttributes().get("dataModelType")に対応する。
 * @param vehicleId
 *     自度運転車両を一意に識別するID。AxispotのMovingObjectStoreData.getAttributes().get("vehicleId")に対応する。
 * @param vehicleName 自動運転車両名。AxispotのMovingObjectStoreData.getAttributes().get("vehicleName")に対応する。
 * @param status 自動運転車両のステータス。AxispotのMovingObjectStoreData.getAttributes().get("status")に対応する。
 * @param lat 緯度。AxispotのMovingObjectStoreData.getAttributes().get("lat")に対応する。
 * @param lng 経度。AxispotのMovingObjectStoreData.getAttributes().get("lng")に対応する。
 * @param height 高度[m]。AxispotのMovingObjectStoreData.getAttributes().get("height")に対応する。
 * @param updatedAt
 *     テレメトリデータの更新時間。AxispotのMovingObjectStoreData.getAttributes().get("updatedAt")に対応する。
 */
public record VehicleInformation(
    ZoneId zoneId,
    String id,
    double longitude,
    double latitude,
    double altitude,
    long time,
    String spatialId,
    String dataModelType,
    Optional<String> vehicleId,
    Optional<String> vehicleName,
    Optional<String> status,
    String lat,
    String lng,
    String height,
    Optional<String> updatedAt) {

  /** Axispotの時空間データの属性のキー */
  static class Attribute {
    /** 空間ID */
    static final String spatialId = "spatialId";

    /** データモデルタイプ */
    static final String dataModelType = "dataModelType";

    /** 自度運転車両を一意に識別するID */
    static final String vehicleId = "vehicleId";

    /** 自動運転車両名 */
    static final String vehicleName = "vehicleName";

    /** 自動運転車両のステータス */
    static final String status = "status";

    /** 緯度 */
    static final String lat = "lat";

    /** 経度 */
    static final String lng = "lng";

    /** 高度[m] */
    static final String height = "height";

    /** テレメトリデータの更新時間 */
    static final String updatedAt = "updatedAt";
  }

  /**
   * Axispotの時空間データの属性Mapに変換する。
   *
   * @return Axispotの時空間データの属性Map
   */
  public Map<String, String> toAttributes() {
    Map<String, String> result = new HashMap<>();
    result.put(Attribute.spatialId, spatialId());
    result.put(Attribute.dataModelType, dataModelType());
    vehicleId().ifPresent(v -> result.put(Attribute.vehicleId, v));
    vehicleName().ifPresent(v -> result.put(Attribute.vehicleName, v));
    status().ifPresent(v -> result.put(Attribute.status, v));
    result.put(Attribute.lat, lat());
    result.put(Attribute.lng, lng());
    result.put(Attribute.height, height());
    updatedAt().ifPresent(v -> result.put(Attribute.updatedAt, v));
    return result;
  }
}
