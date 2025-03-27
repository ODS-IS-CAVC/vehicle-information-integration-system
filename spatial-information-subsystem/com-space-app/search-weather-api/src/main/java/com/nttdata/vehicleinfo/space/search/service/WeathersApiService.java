package com.nttdata.vehicleinfo.space.search.service;

import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;

import com.nttdata.vehicleinfo.space.search.axispot.SpatialId;
import com.nttdata.vehicleinfo.space.search.axispot.WeatherAttributes;
import java.lang.invoke.MethodHandles;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import jp.co.ntt.sic.Geotemp;
import jp.co.ntt.sic.MovingObjectStoreData;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

/** 気象情報を検索するServiceクラス. */
@Service
public class WeathersApiService implements ApiService {

  private static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final Geotemp geotemp;

  public WeathersApiService(@Qualifier("geotemp") Geotemp geotemp) {
    this.geotemp = geotemp;
  }

  /**
   * 指定された日時範囲内および空間IDに含まれる気象情報をAxispotから検索します.
   *
   * @param from 検索開始時刻
   * @param to 検索終了時刻
   * @param spatialId 空間ID
   * @return 気象情報
   */
  @Override
  public List<MovingObjectStoreData> searchObjects(
      final OffsetDateTime from, final OffsetDateTime to, final SpatialId spatialId) {
    // 気象情報は日時情報に分秒情報を持たないため0をセット
    final OffsetDateTime adjustFrom = from.withMinute(0).withSecond(0).withNano(0);

    List<MovingObjectStoreData> results = new ArrayList<>();

    OffsetDateTime searchTime = adjustFrom;
    while (!searchTime.isAfter(to)) {

      log.debug("START search weathers: time={}, spatialID={}", searchTime, spatialId);
      Set<MovingObjectStoreData> objects =
          geotemp.zfxySearch(
              searchTime.toEpochSecond(),
              spatialId.zoom(),
              spatialId.altitude(),
              spatialId.longitude(),
              spatialId.latitude());
      results.addAll(objects);
      log.debug(
          "END search weathers: time={}, spatialID={}, num={}",
          searchTime,
          spatialId,
          objects.size());

      // 1時間後を検索する
      searchTime = searchTime.plusHours(1);
    }
    log.info(
        "searched weathers: time={}, spatialID={}, num={}", searchTime, spatialId, results.size());

    // フィルタリング処理
    results =
        results.stream()
            // 範囲外の時刻情報を持つのオブジェクトを除去
            // fromもtoも一致を含める
            .filter(
                o ->
                    !o.getCreatedAt().toInstant().isBefore(adjustFrom.toInstant())
                        && !o.getCreatedAt().toInstant().isAfter(to.toInstant()))
            // 座標とcreatedAtをもとにStoreDataリストをグルーピング
            .collect(
                Collectors.groupingBy(
                    data -> new ImmutablePair<>(data.getCreatedAt(), data.getCoord())))
            // グルーピングしたリストから更新日時が最新のものを返却
            .values()
            .stream()
            .map(
                l -> {
                  // 気象情報の場合、リストが1件の場合その要素は予測値なのでそのまま返却
                  if (l.size() == 1) {
                    return l.getFirst();
                  }

                  // リストに要素が複数存在するなら更新日時を比較して、最新の更新日時を持つ要素を保持する
                  // のちほどマージするため、予測値と実測値をそれぞれ比較する
                  MovingObjectStoreData latestForecast = null;
                  OffsetDateTime latestForecastUpdatedAtTime = null;
                  MovingObjectStoreData latestActual = null;
                  OffsetDateTime latestActualUpdatedAtTime = null;
                  for (MovingObjectStoreData o : l) {
                    String updatedAtText =
                        o.getAttributes().get(WeatherAttributes.UPDATED_AT.getKey());
                    // 更新日時に利用するフィールドは必ずISO_OFFSET_DATE_TIMEに従うという前提となっている
                    OffsetDateTime updatedAtTime =
                        OffsetDateTime.parse(updatedAtText, ISO_OFFSET_DATE_TIME);
                    // 実測値データの更新
                    if (o.getAttributes()
                        .get(WeatherAttributes.TYPE.getKey())
                        .equalsIgnoreCase("actual")) {
                      if (latestActual == null
                          || updatedAtTime.isAfter(latestActualUpdatedAtTime)) {
                        latestActual = o;
                        latestActualUpdatedAtTime = updatedAtTime;
                      }
                      // 予測値データの更新
                    } else {
                      if (latestForecast == null
                          || updatedAtTime.isAfter(latestForecastUpdatedAtTime)) {
                        latestForecast = o;
                        latestForecastUpdatedAtTime = updatedAtTime;
                      }
                    }
                  }

                  // 収集APのタイミング次第では予測値が存在しない気象データもあるため、ログを出しつつ実測値を返却する
                  if (Objects.isNull(latestForecast)) {
                    log.warn("Return actual value, because forecast value is empty, ");
                    return latestActual;
                  }
                  // 実測値が存在する場合、気温と降水量のみ実測値の値で上書きする
                  if (Objects.nonNull(latestActual)) {
                    // MovingObjectStoreData#getAttributeはImmutableなので、一度コピー
                    Map<String, String> attributes = new HashMap<>(latestForecast.getAttributes());
                    attributes.put(
                        WeatherAttributes.TEMPERATURE.getKey(),
                        latestActual.getAttributes().get(WeatherAttributes.TEMPERATURE.getKey()));
                    attributes.put(
                        WeatherAttributes.PRECIPITATION.getKey(),
                        latestActual.getAttributes().get(WeatherAttributes.PRECIPITATION.getKey()));
                    // 更新日時も実測値のものにする
                    attributes.put(
                        WeatherAttributes.UPDATED_AT.getKey(),
                        latestActual.getAttributes().get(WeatherAttributes.UPDATED_AT.getKey()));
                    latestForecast.setAttributes(attributes);
                  }
                  return latestForecast;
                })
            .collect(Collectors.toList());
    log.info(
        "filtered weathers: time={}, spatialID={}, num={}", searchTime, spatialId, results.size());

    return results;
  }
}
