package com.nttdata.vehicleinfo.space.search.service;

import com.nttdata.vehicleinfo.space.search.axispot.SpatialId;
import com.nttdata.vehicleinfo.space.search.axispot.TargetAttributes;
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

/** 物標情報を検索するServiceクラス. */
@Service
public class TargetsApiService implements ApiService {

  private static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final Geotemp geotemp;
  private final GeotempConfig geotempConfig;

  public TargetsApiService(
      @Qualifier("geotempConfig") GeotempConfig geotempConfig,
      @Qualifier("geotemp") Geotemp geotemp) {
    this.geotemp = geotemp;
    this.geotempConfig = geotempConfig;
  }

  /**
   * 指定された日時範囲内および空間IDに含まれる物標情報をAxispotから検索します.
   *
   * @param from 検索開始時刻
   * @param to 検索終了時刻
   * @param spatialId 空間ID
   * @return 物標情報
   */
  @Override
  public List<MovingObjectStoreData> searchObjects(
      OffsetDateTime from, OffsetDateTime to, SpatialId spatialId) {

    List<MovingObjectStoreData> results = new ArrayList<>();

    // ズームレベルから検索時間間隔を特定する
    final long axispotTimeResolution =
        BitPatternUtils.getTimeResolution(geotempConfig, spatialId.zoom());

    // 終了日時まで時間解像度ごとに検索する
    // 終了日時を含んだ時空間インデックスで確実に検索するため、検索対象期間は終了日時＋時間解像度とする
    OffsetDateTime searchTime = from;
    OffsetDateTime searchEndTime = to.plusSeconds(axispotTimeResolution);
    while (!searchTime.isAfter(searchEndTime)) {

      log.debug("START search targets: time={}, spatialID={}", searchTime, spatialId);
      Set<MovingObjectStoreData> objects =
          geotemp.zfxySearch(
              searchTime.toEpochSecond(),
              spatialId.zoom(),
              spatialId.altitude(),
              spatialId.longitude(),
              spatialId.latitude());
      // TargetIdが存在するものだけ抽出する
      objects =
          objects.stream()
              .filter(o -> o.getAttributes().containsKey(TargetAttributes.TARGET_ID.getKey()))
              .collect(Collectors.toSet());
      results.addAll(objects);
      log.debug(
          "END search targets: time={}, spatialID={}, num={}",
          searchTime,
          spatialId,
          objects.size());

      searchTime = searchTime.plusSeconds(axispotTimeResolution);
    }
    log.info(
        "searched targets: time={}, spatialID={}, num={}", searchTime, spatialId, results.size());

    // 重複排除には、targetIdとtimeを利用する
    results =
        StoreDataUtils.filterTimeAndDuplicate(
            results,
            from,
            to,
            data ->
                new ImmutablePair<>(
                    data.getCreatedAt(),
                    data.getAttributes().get(TargetAttributes.TARGET_ID.getKey())),
            TargetAttributes.TIME);
    log.info(
        "filtered targets: time={}, spatialID={}, num={}", searchTime, spatialId, results.size());

    return results;
  }
}
