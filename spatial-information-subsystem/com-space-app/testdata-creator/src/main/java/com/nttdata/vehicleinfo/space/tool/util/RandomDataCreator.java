package com.nttdata.vehicleinfo.space.tool.util;

import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;

import com.nttdata.vehicleinfo.collection.spatialindexcreator.SpatialId;
import com.nttdata.vehicleinfo.space.tool.config.TestDataConfig;
import com.nttdata.vehicleinfo.space.tool.config.TestDataConfig.RandomTemplateType;
import java.io.BufferedWriter;
import java.io.Closeable;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.nio.file.Path;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.UUID;
import java.util.function.Supplier;
import jp.co.ntt.sic.MovingObjectKey;
import jp.co.ntt.sic.MovingObjectRawData;
import jp.co.ntt.sic.MovingObjectValue;
import org.locationtech.jts.geom.Coordinate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** ランダムな座標を持つAxispotデータの生成器. */
public class RandomDataCreator {

  private static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final Random rand = new Random();
  private final TestDataConfig.RandomData config;

  /**
   * ランダムな座標を持つAxispotデータの生成器.
   *
   * @param config ランダム設定
   */
  public RandomDataCreator(TestDataConfig.RandomData config) {
    this.config = config;

    log.info(
        "init random data creator: name=\"{}\", type=\"{}\"", config.name(), config.templateType());
  }

  private class BufferedWriterWrapper implements Closeable {
    private final Path outputDir;
    private final String dataId;

    private BufferedWriter outputWriter = null;

    private BufferedWriterWrapper(Path outputDir, String dataId) {
      this.outputDir = outputDir;
      this.dataId = dataId;
      // 出力先が設定されている場合、BufferedWriterを開く
      if (Objects.nonNull(outputDir)) {
        open();
      }
    }

    private void open() {
      Path outputFile =
          outputDir.resolve(
              config.id()
                  + "_"
                  + config.templateType().name().toLowerCase()
                  + "_"
                  + dataId
                  + ".csv");
      // 出力先ディレクトリが存在していなければ作成
      if (!outputFile.getParent().toFile().exists()) {
        outputFile.getParent().toFile().mkdirs();
      }
      // BufferWriterを開く
      try {
        outputWriter = new BufferedWriter(new FileWriter(outputFile.toFile(), true));
        log.info("open output file: path={}", outputFile);
      } catch (IOException e) {
        // ファイル出力よりデータ出力を優先するため、例外はログに出すだけにとどめる
        log.error("failed to open output file.", e);
      }
    }

    public void writeGeneratedCoordinate(OffsetDateTime datetime, SpatialId spatialId) {
      if (Objects.nonNull(outputWriter)) {
        try {
          outputWriter.write(
              String.join(
                  ",",
                  ISO_OFFSET_DATE_TIME.format(datetime),
                  dataId,
                  String.valueOf(spatialId.longitude().value()),
                  String.valueOf(spatialId.latitude().value()),
                  String.valueOf(spatialId.altitude().value())));
          outputWriter.newLine();
        } catch (IOException e) {
          log.error("failed to write generated coordinate.", e);
        }
      }
    }

    @Override
    public void close() throws IOException {
      if (Objects.nonNull(outputWriter)) {
        outputWriter.close();
        outputWriter = null;
      }
    }
  }

  /**
   * 指定された領域内からランダムに選択された座標を持つAxispotデータを生成します.
   *
   * @param baseTime データの生成開始時刻
   * @param duration データの生成期間
   * @param outputDir 生成データ出力ディレクトリ
   * @return Axispotデータリスト
   */
  public List<MovingObjectRawData> create(
      OffsetDateTime baseTime, Duration duration, Path outputDir) {
    List<MovingObjectRawData> data = new ArrayList<>();

    // 定義されている生成エリアの数だけデータを生成
    for (TestDataConfig.Area area : config.areas()) {

      // データID
      final String dataId = createId();

      log.info("create data: id={}, area={}", dataId, area);

      // 開始時刻
      // baseTimeがシナリオ個別に設定されている場合そちらを利用する
      OffsetDateTime datetime = baseTime;
      if (Objects.nonNull(this.config.baseTime())) {
        datetime = this.config.baseTime();
      }
      // 終了時刻はbaseTimeにdurationを加算した値となる
      // durationがシナリオ個別に設定されている場合そちらを利用する
      OffsetDateTime endtime = datetime.plus(duration);
      if (Objects.nonNull(this.config.duration())) {
        endtime = datetime.plus(this.config.duration());
      }

      // 出力ファイルを開く
      try (BufferedWriterWrapper wrapper = new BufferedWriterWrapper(outputDir, dataId)) {

        // 指定した期間の間、指定した間隔でデータを生成
        while (datetime.isBefore(endtime)) {

          // 位置情報が未定義なら生成をスキップする
          if (Objects.isNull(area.coordinate()) && area.boundingBoxes().isEmpty()) {
            log.warn("random data position is empty.");
            continue;
          }

          // 空間IDを生成する
          SpatialId spatialId = createRandomSpatial(area);

          // 生成した座標データを書き込む
          wrapper.writeGeneratedCoordinate(datetime, spatialId);

          // 種別に応じてデータを生成する
          switch (this.config.templateType()) {
            case VEHICLE -> data.add(createVehicleData(spatialId, datetime, dataId));
            case TARGET -> data.add(createTargetData(spatialId, datetime, dataId));
            case WEATHER -> {
              // 気象情報のみ実測値と予測値の2種類を生成する
              data.add(createWeatherData(spatialId, datetime, "forecast"));
              data.add(createWeatherData(spatialId, datetime, "actual"));
            }
          }

          // interval分インクリメントする
          datetime = datetime.plus(this.config.interval());
        }

      } catch (IOException e) {
        log.error("failed close output file.", e);
      }

      // 車両や物標情報は、1つ目の位置情報を書き込んだ時点で生成を終了する
      // staticAttributesでIDを固定した場合に、同じIDの情報が同時刻に複数エリアに存在することを防ぐため
      if (config.templateType() != RandomTemplateType.WEATHER) {
        break;
      }
    }

    return data;
  }

  private String createId() {
    // 車両か、物標情報かによってIDの生成ルールが異なる
    // 車両の場合はUUID、物標の場合はランダムな数値をIDとする
    // 気象情報はIDが存在しないため、ファイル出力用に日時とする
    switch (config.templateType()) {
      case VEHICLE -> {
        if (Objects.nonNull(config.staticAttributes())
            && config.staticAttributes().containsKey("vehicleId")) {
          return config.staticAttributes().get("vehicleId");
        } else {
          return UUID.randomUUID().toString();
        }
      }
      case TARGET -> {
        if (Objects.nonNull(config.staticAttributes())
            && config.staticAttributes().containsKey("targetID")) {
          return config.staticAttributes().get("targetID");
        } else {
          return String.valueOf(rand.nextLong(4294967295L));
        }
      }
      case WEATHER -> {
        return OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
      }
      default -> throw new IllegalStateException("Unexpected value: " + config.templateType());
    }
  }

  private SpatialId createRandomSpatial(TestDataConfig.Area area) {
    // 固定座標が指定されてていればそれを利用する、なければランダムに緯度経度を設定する
    double longitude;
    double latitude;
    double altitude;
    if (Objects.nonNull(area.coordinate())) {
      longitude = area.coordinate().longitude();
      latitude = area.coordinate().latitude();
      altitude = area.coordinate().altitude();
    } else {
      // BoundingBoxをランダムに決定する
      TestDataConfig.BoundingBox bbox =
          area.boundingBoxes().get(rand.nextInt(area.boundingBoxes().size()));
      longitude = bbox.swLon() + (bbox.neLon() - bbox.swLon()) * rand.nextDouble();
      latitude = bbox.swLat() + (bbox.neLat() - bbox.swLat()) * rand.nextDouble();
      // ランダム座標では高度は0固定
      altitude = 0;
    }
    // ズームレベルは種別に応じて変更する
    return new SpatialId(config.templateType().getZoomLevel(), altitude, longitude, latitude);
  }

  private static final String[] vehicleStatus = {
    "disconnected",
    "connected",
    "initializing",
    "task_acceptable",
    "ready",
    "driving",
    "task_completed",
    "pausing",
    "abnormal",
    "shutdown"
  };

  private MovingObjectRawData createVehicleData(
      SpatialId spatialId, OffsetDateTime datetime, String vehicleId) {
    MovingObjectKey key =
        new MovingObjectKey(
            datetime.toEpochSecond(),
            spatialId.longitude().value(),
            spatialId.latitude().value(),
            spatialId.altitude().value(),
            "testdata-random-create");

    // 属性データの定義
    // 必要な属性キー名はsearch-vehicle-apiのVehicleAttributesを参照
    Map<String, String> attributes =
        Map.ofEntries(
            Map.entry("spatialId", spatialId.formatToZfxy()),
            Map.entry("vehicleId", vehicleId),
            Map.entry("vehicleName", "testdata-vehicle"),
            Map.entry(
                "updatedAt",
                ISO_OFFSET_DATE_TIME.format(datetime.plus(this.config.updatedAtOffset()))),
            // 緯度経度は空間IDから取得
            Map.entry("longitude", String.valueOf(spatialId.longitude())),
            Map.entry("latitude", String.valueOf(spatialId.latitude())),
            Map.entry("height", String.valueOf(spatialId.altitude())),
            // 以下はランダム値
            entryRandomOrStatic("status", () -> vehicleStatus[rand.nextInt(vehicleStatus.length)]));

    MovingObjectValue value =
        new MovingObjectValue(
            new Coordinate(
                spatialId.longitude().value(),
                spatialId.latitude().value(),
                spatialId.altitude().value()),
            Timestamp.from(datetime.toInstant()),
            attributes);

    return new MovingObjectRawData(key, value);
  }

  private MovingObjectRawData createTargetData(
      SpatialId spatialId, OffsetDateTime datetime, String targetId) {
    MovingObjectKey key =
        new MovingObjectKey(
            datetime.toEpochSecond(),
            spatialId.longitude().value(),
            spatialId.latitude().value(),
            spatialId.altitude().value(),
            "testdata-random-create");

    // 属性データの定義
    // 必要な属性キー名はsearch-vehicle-apiのTargetAttributesを参照
    Map<String, String> attributes =
        Map.ofEntries(
            Map.entry("spatialId", spatialId.formatToZfxy()),
            Map.entry("targetID", targetId),
            Map.entry(
                "time", ISO_OFFSET_DATE_TIME.format(datetime.plus(this.config.updatedAtOffset()))),
            // 経度、緯度は0.0000001の分解能で格納
            Map.entry(
                "longitude", String.valueOf((int) (spatialId.longitude().value() / 0.0000001))),
            Map.entry("latitude", String.valueOf((int) (spatialId.latitude().value() / 0.0000001))),
            // 高さは0.1の分解能で格納
            Map.entry("elevation", String.valueOf((int) (spatialId.altitude().value() / 0.1))),
            // 以下はランダム値
            entryRandomOrStatic("positionConf", () -> rand.nextInt(0, 16)),
            entryRandomOrStatic("elevationConf", () -> rand.nextInt(0, 16)),
            entryRandomOrStatic("speed", () -> rand.nextInt(0, 65536)),
            entryRandomOrStatic("heading", () -> rand.nextInt(0, 65536)),
            entryRandomOrStatic("acceleration", () -> rand.nextInt(0, 4001) - 2000),
            entryRandomOrStatic("speedConf", () -> rand.nextInt(0, 8)),
            entryRandomOrStatic("headingConf", () -> rand.nextInt(0, 8)),
            entryRandomOrStatic("forwardRearAccelerationConf", () -> rand.nextInt(0, 8)),
            entryRandomOrStatic("sizeClassification", () -> rand.nextInt(0, 16)),
            entryRandomOrStatic("roleClassification", () -> rand.nextInt(0, 16)),
            entryRandomOrStatic("vehicleWidth", () -> rand.nextInt(1, 1024)),
            entryRandomOrStatic("vehicleLength", () -> rand.nextInt(1, 16384)),
            entryRandomOrStatic(
                "semiMajorAxisOfPositionalErrorEllipse", () -> rand.nextInt(0, 256)),
            entryRandomOrStatic(
                "semiMinorAxisOfPositionalErrorEllipse", () -> rand.nextInt(0, 256)),
            entryRandomOrStatic(
                "semiMajorAxisOrientationOfPositionalErrorEllipse", () -> rand.nextInt(0, 65536)),
            entryRandomOrStatic("GPSPositioningMode", () -> rand.nextInt(0, 4)),
            entryRandomOrStatic("GPSPDOP", () -> rand.nextInt(0, 64)),
            entryRandomOrStatic("restingState", () -> rand.nextInt(0, 3603)));

    MovingObjectValue value =
        new MovingObjectValue(
            new Coordinate(
                spatialId.longitude().value(),
                spatialId.latitude().value(),
                spatialId.altitude().value()),
            Timestamp.from(datetime.toInstant()),
            attributes);

    return new MovingObjectRawData(key, value);
  }

  private MovingObjectRawData createWeatherData(
      SpatialId spatialId, OffsetDateTime datetime, String type) {
    // 気象情報であれば分より小さい情報を0にセットする
    datetime = datetime.withMinute(0).withSecond(0).withNano(0);
    MovingObjectKey key =
        new MovingObjectKey(
            datetime.toEpochSecond(),
            spatialId.longitude().value(),
            spatialId.latitude().value(),
            spatialId.altitude().value(),
            "testdata-random-create");

    // 属性データの定義
    // 必要な属性キー名はsearch-vehicle-apiのVehicleAttributesを参照
    Map<String, String> attributes =
        Map.ofEntries(
            Map.entry("spatialId", spatialId.formatToZfxy()),
            Map.entry(
                "updatedAt",
                ISO_OFFSET_DATE_TIME.format(datetime.plus(this.config.updatedAtOffset()))),
            Map.entry("type", type), // 予測値と実測値の両方を生成する必要がある
            // 以下はランダム値
            // 東京都の過去データから乱数のざっくりとした範囲を決定する
            // https://www.data.jma.go.jp/obd/stats/etrn/view/rank_s.php?prec_no=44&block_no=47662
            entryRandomOrStatic("humidity", () -> String.format("%.1f", rand.nextDouble() * 100)),
            entryRandomOrStatic(
                "temperature",
                () -> String.format("%.1f", rand.nextDouble() * 50 - 10)), // 日最高気温が39.5、日最低気温が-9.2
            entryRandomOrStatic(
                "weatherForecast", () -> rand.nextInt(1, 6) * 100), // 100, 200, 300, 400, 500のいずれか
            entryRandomOrStatic(
                "windDirection", () -> String.format("%.1f", rand.nextDouble() * 360)), // 0～360度
            entryRandomOrStatic(
                "windSpeed", () -> String.format("%.1f", rand.nextDouble() * 31)), // 日最大風速が31m/s
            entryRandomOrStatic(
                "precipitation",
                () -> String.format("%.1f", rand.nextDouble() * 90)) // 最大時間降水量が88.7mm/h
            );

    MovingObjectValue value =
        new MovingObjectValue(
            new Coordinate(
                spatialId.longitude().value(),
                spatialId.latitude().value(),
                spatialId.altitude().value()),
            Timestamp.from(datetime.toInstant()),
            attributes);

    return new MovingObjectRawData(key, value);
  }

  private Map.Entry<String, String> entryRandomOrStatic(
      String key, Supplier<Object> valueSupplier) {
    if (Objects.nonNull(this.config.staticAttributes())
        && this.config.staticAttributes().containsKey(key)) {
      return Map.entry(key, this.config.staticAttributes().get(key));
    } else {
      return Map.entry(key, String.valueOf(valueSupplier.get()));
    }
  }
}
