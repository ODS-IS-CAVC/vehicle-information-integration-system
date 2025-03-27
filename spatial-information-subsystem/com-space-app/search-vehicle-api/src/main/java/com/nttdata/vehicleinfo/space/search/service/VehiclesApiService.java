package com.nttdata.vehicleinfo.space.search.service;

import com.nttdata.vehicleinfo.space.search.axispot.SpatialId;
import com.nttdata.vehicleinfo.space.search.axispot.VehicleAttributes;
import com.nttdata.vehicleinfo.space.search.util.BitPatternUtils;
import com.nttdata.vehicleinfo.space.search.util.StoreDataUtils;
import java.lang.invoke.MethodHandles;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import jp.co.ntt.sic.Geotemp;
import jp.co.ntt.sic.MovingObjectStoreData;
import jp.co.ntt.sic.config.GeotempConfig;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

/** 車両プローブ情報を検索するServiceクラス. */
@Service
public class VehiclesApiService implements ApiService {

  private static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final Geotemp geotemp;
  private final GeotempConfig geotempConfig;

  public VehiclesApiService(
      @Qualifier("geotempConfig") GeotempConfig geotempConfig,
      @Qualifier("geotemp") Geotemp geotemp) {
    this.geotemp = geotemp;
    this.geotempConfig = geotempConfig;
  }

  /**
   * 指定された日時範囲内および空間IDに含まれる車両情報をAxispotから検索します.
   *
   * @param from 検索開始時刻
   * @param to 検索終了時刻
   * @param spatialId 空間ID
   * @return 車両情報
   */
  @Override
  public List<MovingObjectStoreData> searchObjects(
      final OffsetDateTime from, final OffsetDateTime to, final SpatialId spatialId) {

    List<MovingObjectStoreData> results = new ArrayList<>();

    // ズームレベルから検索時間間隔を特定する
    final long axispotTimeResolution =
        BitPatternUtils.getTimeResolution(geotempConfig, spatialId.zoom());

    // 開始日時から終了日時までの期間を時間解像度ごとに検索する
    // 終了日時を含んだ時空間インデックスで確実に検索するため、検索対象期間は終了日時＋時間解像度とする
    OffsetDateTime searchTime = from;
    OffsetDateTime searchEndTime = to.plusSeconds(axispotTimeResolution);
    while (!searchTime.isAfter(searchEndTime)) {

      log.debug("START search vehicles: time={}, spatialID={}", searchTime, spatialId);
      Set<MovingObjectStoreData> objects =
          geotemp.zfxySearch(
              searchTime.toEpochSecond(),
              spatialId.zoom(),
              spatialId.altitude(),
              spatialId.longitude(),
              spatialId.latitude());
      // VehicleIdが存在するものだけを抽出する
      objects =
          objects.stream()
              .filter(o -> o.getAttributes().containsKey(VehicleAttributes.VEHICLE_ID.getKey()))
              .collect(Collectors.toSet());
      results.addAll(objects);
      log.debug(
          "END search vehicles: time={}, spatialID={}, num={}",
          searchTime,
          spatialId,
          objects.size());

      // 時間解像度を加算する
      searchTime = searchTime.plusSeconds(axispotTimeResolution);
    }
    log.info(
        "searched vehicles: from={}, to={}, spatialID={}, num={}",
        from,
        to,
        spatialId,
        results.size());

    // 重複排除には、vehicleIdとupdatedAtを利用する
    results =
        StoreDataUtils.filterTimeAndDuplicate(
            results,
            from,
            to,
            data ->
                new ImmutablePair<>(
                    data.getCreatedAt(),
                    data.getAttributes().get(VehicleAttributes.VEHICLE_ID.getKey())),
            VehicleAttributes.UPDATED_AT);
    log.info(
        "filtered vehicles: from={}, to={}, spatialID={}, num={}",
        from,
        to,
        spatialId,
        results.size());

    return results;
  }
}
