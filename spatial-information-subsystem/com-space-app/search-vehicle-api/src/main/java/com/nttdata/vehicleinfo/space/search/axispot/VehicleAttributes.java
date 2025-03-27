package com.nttdata.vehicleinfo.space.search.axispot;

/** Axispotに格納されている車両プローブ情報データが保持する属性情報のキー一覧. */
public enum VehicleAttributes implements StoreDataAttribute {

  /** 空間ID(ズームレベル25相当) */
  SPATIAL_ID("spatialId"),
  /** 車両ID */
  VEHICLE_ID("vehicleId"),
  /** 車両名 */
  VEHICLE_NAME("vehicleName"),
  /** 車両ステータス */
  STATUS("status"),
  /** 高度 */
  HEIGHT("height"),
  /** 更新日時 */
  UPDATED_AT("updatedAt");

  private final String key;

  VehicleAttributes(String key) {
    this.key = key;
  }

  public String getKey() {
    return key;
  }
}
