package com.nttdata.vehicleinfo.space.search.util;

import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;
import static org.assertj.core.api.Assertions.assertThat;

import com.nttdata.vehicleinfo.space.search.axispot.StoreDataAttribute;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import jp.co.ntt.sic.MovingObjectStoreData;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;

public class StoreDataUtilsTest {

  @Test
  public void insideTimeRange() {
    String objectId = "test";
    OffsetDateTime startTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));
    OffsetDateTime endTime = startTime.plusHours(1);

    // テストデータ
    List<MovingObjectStoreData> data =
        List.of(
            // 開始時刻より1秒手前のデータ
            createData(objectId, startTime.minusSeconds(1), startTime.minusSeconds(1)),
            // 開始時刻と同じデータ
            createData(objectId, startTime, startTime),
            // 開始時刻より1秒後ろのデータ
            createData(objectId, startTime.plusSeconds(1), startTime.plusSeconds(1)),
            // 終了時刻より1秒手前のデータ
            createData(objectId, endTime.minusSeconds(1), endTime.minusSeconds(1)),
            // 終了時刻と同じデータ
            createData(objectId, endTime, endTime),
            // 終了時刻より1秒後ろのデータ
            createData(objectId, endTime.plusSeconds(1), endTime.plusSeconds(1)));

    // フィルタの実施
    List<MovingObjectStoreData> results =
        StoreDataUtils.filterTimeAndDuplicate(
            data,
            startTime,
            endTime,
            d -> new ImmutablePair<>(d.getCreatedAt(), d.getMovingObjectId()),
            DummyAttributes.UPDATED_AT);

    // 検証
    assertThat(results).hasSize(4); // 要素数が2であること
  }

  @Test
  public void duplicatedData() {
    String objectId1 = "test1";
    String objectId2 = "test2";
    OffsetDateTime startTime = OffsetDateTime.of(2024, 10, 28, 12, 0, 0, 0, ZoneOffset.ofHours(9));
    OffsetDateTime endTime = startTime.plusHours(1);

    // テストデータ
    List<MovingObjectStoreData> data =
        List.of(
            // objectId1のデータ
            createData(objectId1, startTime, startTime),
            // objectId1と同じcreatedAtかつ1分古いupdatedAtを持つデータ
            createData(objectId1, startTime, startTime.minusMinutes(1)),
            // objectId1と同じcreatedAtかつ1分新しいupdatedAtを持つデータ
            createData(objectId1, startTime, startTime.plusMinutes(1)),
            // objectId1と異なるcreatedAtを持つデータ
            createData(objectId1, startTime.plusMinutes(1), startTime.plusMinutes(1)),
            // 同じcreatedAtで、objectIdの異なるデータ
            createData(objectId2, startTime, startTime));

    // フィルタの実施
    List<MovingObjectStoreData> results =
        StoreDataUtils.filterTimeAndDuplicate(
            data,
            startTime,
            endTime,
            d -> new ImmutablePair<>(d.getCreatedAt(), d.getMovingObjectId()),
            DummyAttributes.UPDATED_AT);

    // 検証
    // 以下の要素が存在すること
    //   objectId1, startTime
    //   objectId1, startTime.plusMinutes(1)
    //   objectId2, startTime
    assertThat(results).hasSize(3);
    // objectId1, startTimeのデータのupdatedAtがstartTime.plusMinutes(1)であること
    Optional<OffsetDateTime> updatedAtOfDuplicatedData =
        results.stream()
            .filter(
                d ->
                    d.getMovingObjectId().equals(objectId1)
                        && d.getCreatedAt().equals(Timestamp.from(startTime.toInstant())))
            .map(d -> d.getAttributes().get(DummyAttributes.UPDATED_AT.getKey()))
            .map(s -> OffsetDateTime.parse(s, ISO_OFFSET_DATE_TIME))
            .findAny();
    assertThat(updatedAtOfDuplicatedData).isPresent();
    assertThat(updatedAtOfDuplicatedData.get()).isEqualTo(startTime.plusMinutes(1));
  }

  private static MovingObjectStoreData createData(
      String objectId, OffsetDateTime createdAt, OffsetDateTime updatedAt) {
    return new MovingObjectStoreData(
        objectId,
        new Coordinate(0, 0, 0), // 重複判定に座標を利用しないので適当
        Timestamp.from(createdAt.toInstant()),
        Map.ofEntries(
            Map.entry(
                DummyAttributes.UPDATED_AT.getKey(), ISO_OFFSET_DATE_TIME.format(updatedAt))));
  }

  private enum DummyAttributes implements StoreDataAttribute {
    UPDATED_AT("updatedAt");

    private final String key;

    DummyAttributes(String key) {
      this.key = key;
    }

    public String getKey() {
      return key;
    }
  }
}
