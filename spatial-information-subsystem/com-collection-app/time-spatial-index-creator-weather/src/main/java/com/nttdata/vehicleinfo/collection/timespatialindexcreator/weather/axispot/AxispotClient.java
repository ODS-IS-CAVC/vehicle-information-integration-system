package com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.axispot;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.WeatherInformation;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.lang.invoke.MethodHandles;
import java.nio.file.Path;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import jp.co.ntt.sic.Geotemp;
import jp.co.ntt.sic.MovingObjectKey;
import jp.co.ntt.sic.MovingObjectRawData;
import jp.co.ntt.sic.MovingObjectStoreData;
import jp.co.ntt.sic.MovingObjectValue;
import jp.co.ntt.sic.config.GeotempConfig;
import org.locationtech.jts.geom.Coordinate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * AxispotClient
 *
 * <p>Axispotの提供するライブラリを利用し、Axispotを操作する。
 */
public class AxispotClient implements AutoCloseable {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  Geotemp geotemp;

  /**
   * 指定されたAxispot設定ファイルパスでAxispotに接続が成功した場合のみ生成する。
   *
   * @param axispotConfigPath Axispot設定ファイルパス
   * @throws UncheckedIOException Axispot設定ファイル読み取り失敗
   */
  public AxispotClient(Path axispotConfigPath) {
    logger.debug("path : {}", axispotConfigPath);
    try {
      GeotempConfig geotempConfig = new GeotempConfig(axispotConfigPath);
      logger.debug("store : {}", geotempConfig.getStoreNodeInfo());
      this.geotemp = new Geotemp(geotempConfig);
    } catch (IOException e) {
      logger.error("Axispot設定ファイル読み取り失敗", e);
      throw new UncheckedIOException("Axispot設定ファイル読み取り失敗", e);
    } catch (Exception e) {
      logger.error("AxispotClient初期化失敗", e);
      throw e;
    }
  }

  /**
   * リソースを閉じる。
   *
   * <p>Axispotのclose処理は1度だけ呼び出す。
   *
   * <p>Axispotのclose処理が失敗した場合は警告ログを出力して処理を継続する。
   */
  @Override
  public void close() {
    if (this.geotemp == null) {
      return;
    }
    try {
      this.geotemp.close();
    } catch (Exception e) {
      // WARNログを出力するのみ
      logger.warn("Axispot終了失敗", e);
    } finally {
      this.geotemp = null;
    }
  }

  /**
   * 指定された気象情報をAxispotに格納する。
   *
   * @param weatherInformation 気象情報
   * @throws IllegalStateException 既にクローズ済み
   */
  public void set(WeatherInformation weatherInformation) {
    if (this.geotemp == null) {
      throw new IllegalStateException("既に終了済み");
    }
    MovingObjectKey key = getMovingObjectKey(weatherInformation);
    MovingObjectValue value = getMovingObjectValue(weatherInformation);
    MovingObjectRawData entry = new MovingObjectRawData(key, value);
    try {
      geotemp.set(entry);
    } catch (IllegalArgumentException e) {
      logger.warn("Axispotが扱えないデータのため格納をスキップ: MovingObjectId={}", key.getMovingObjectId(), e);
    }
  }

  static MovingObjectKey getMovingObjectKey(WeatherInformation weatherInformation) {
    MovingObjectKey key =
        new MovingObjectKey(
            weatherInformation.getTime().toEpochSecond(),
            weatherInformation.getLongitude(),
            weatherInformation.getLatitude(),
            weatherInformation.getAltitude(),
            weatherInformation.getId());
    return key;
  }

  static MovingObjectValue getMovingObjectValue(WeatherInformation weatherInformation) {
    Coordinate locCoord =
        new Coordinate(
            weatherInformation.getLongitude(),
            weatherInformation.getLatitude(),
            weatherInformation.getAltitude());
    Map<String, String> attributes = new HashMap<>();
    attributes.putAll(weatherInformation.toAttributes());
    // java.sql.Timestampはミリ秒なので1000倍する
    MovingObjectValue value =
        new MovingObjectValue(
            locCoord,
            new Timestamp(weatherInformation.getTime().toEpochSecond() * 1000),
            attributes);
    return value;
  }

  /**
   * 指定された時空間情報（時間、経度、緯度、高度）および検索精度でAxispotを検索する。
   *
   * @param time 時間(エポック秒）
   * @param longitude 経度
   * @param latitude 緯度
   * @param altitude 高度
   * @param searchPrecision 検索精度
   * @return Axispot時空間データのSet
   */
  public Set<MovingObjectStoreData> search(
      long time, double longitude, double latitude, double altitude, int searchPrecision) {
    if (this.geotemp == null) {
      throw new IllegalStateException("既に終了済み");
    }
    try {
      return geotemp.search(time, longitude, latitude, altitude, searchPrecision);
    } catch (Exception e) {
      logger.error("Axispot検索失敗", e);
      throw e;
    }
  }
}
