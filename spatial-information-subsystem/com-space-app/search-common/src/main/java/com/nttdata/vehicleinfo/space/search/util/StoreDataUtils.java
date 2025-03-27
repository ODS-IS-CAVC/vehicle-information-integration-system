package com.nttdata.vehicleinfo.space.search.util;

import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;

import com.nttdata.vehicleinfo.space.search.axispot.StoreDataAttribute;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import jp.co.ntt.sic.MovingObjectStoreData;

/** Axispotから取得したStoreDataに関する汎用関数を実装したUtilクラス. */
public class StoreDataUtils {

  /**
   * Axispotから取得したStoreDataから、時間範囲外と重複のあるデータを排除する.
   *
   * @param storeDataList フィルタ対象のStoreDataリスト
   * @param from 開始時刻
   * @param to 終了時刻
   * @param duplicateClassifier 重複排除判定を行なうキー生成関数
   * @param updatedAt 更新日時を表す属性
   * @return フィルタ済みStoreDataリスト
   */
  public static List<MovingObjectStoreData> filterTimeAndDuplicate(
      List<MovingObjectStoreData> storeDataList,
      final OffsetDateTime from,
      final OffsetDateTime to,
      final Function<MovingObjectStoreData, ?> duplicateClassifier,
      final StoreDataAttribute updatedAt) {
    return storeDataList.stream()
        // 範囲外の時刻情報を持つのオブジェクトを除去
        // fromもtoも一致を含める
        .filter(
            o ->
                !o.getCreatedAt().toInstant().isBefore(from.toInstant())
                    && !o.getCreatedAt().toInstant().isAfter(to.toInstant()))
        // 与えられたキー生成関数をもとにStoreDataリストをグルーピング
        .collect(Collectors.groupingBy(duplicateClassifier))
        // グルーピングしたリストから更新日時が最新のものを返却
        .values()
        .stream()
        .map(
            l -> {
              // リストが1ならそのまま要素を返却
              if (l.size() == 1) {
                return l.getFirst();
              }

              // リストに要素が複数存在するなら更新日時を比較して、最新の更新日時を持つ要素を返却する
              MovingObjectStoreData latest = null;
              OffsetDateTime latestUpdatedAtTime = null;
              for (MovingObjectStoreData o : l) {
                String updatedAtText = o.getAttributes().get(updatedAt.getKey());
                // 更新日時に利用するフィールドは必ずISO_OFFSET_DATE_TIMEに従うという前提となっている
                OffsetDateTime updatedAtTime =
                    OffsetDateTime.parse(updatedAtText, ISO_OFFSET_DATE_TIME);
                if (latest == null || updatedAtTime.isAfter(latestUpdatedAtTime)) {
                  latest = o;
                  latestUpdatedAtTime = updatedAtTime;
                }
              }
              return latest;
            })
        .collect(Collectors.toList());
  }
}
