package com.nttdata.vehicleinfo.space.search.service;

import com.nttdata.vehicleinfo.space.search.axispot.SpatialId;
import java.time.OffsetDateTime;
import java.util.List;
import jp.co.ntt.sic.MovingObjectStoreData;

/** Axispotからデータを検索するServiceインターフェース. */
public interface ApiService {

  /**
   * 指定の日時範囲内の空間ID上に存在するデータを検索する.
   *
   * @param from 検索開始時刻
   * @param to 検索終了時刻
   * @param spatialId 空間ID
   * @return Axispotデータ
   */
  default List<MovingObjectStoreData> searchObjects(
      OffsetDateTime from, OffsetDateTime to, SpatialId spatialId) {
    return List.of();
  }
}
