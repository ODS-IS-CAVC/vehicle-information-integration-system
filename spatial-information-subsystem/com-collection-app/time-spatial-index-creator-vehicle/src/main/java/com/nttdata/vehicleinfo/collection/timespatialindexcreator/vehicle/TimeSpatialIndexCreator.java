package com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.axispot.AxispotClient;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.tier4.VehiclesResponseParser;
import java.io.Closeable;
import java.io.UncheckedIOException;
import java.lang.invoke.MethodHandles;
import java.nio.file.Path;
import java.time.ZoneId;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 時空間ID生成ライブラリ（車両情報）
 *
 * <p>Axispot設定ファイル(.properties)のサンプル:
 *
 * <pre>
 * bitPattern=tttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:52:ZFXY
 * storeNodeInfo=[REDIS_CLUSTER_HOST]:[REDIS_CLUSTER_PORT]
 * enableBulk=false
 * # 3days = 259200sec
 * cacheTtl=259200
 * </pre>
 */
public class TimeSpatialIndexCreator implements Closeable {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private AxispotClient axispotClient;
  private ZoneId axispotZoneId;
  private ZoneId digitalZensoApiZoneId;

  /**
   * 指定したAxispot設定ファイルパスが正しい場合のみ生成する。
   *
   * @param axispotConfigPath Axispot設定ファイルパス
   * @param axispotZoneId Axispotタイムゾーン
   * @param digitalZensoApiZoneId DigitalZensoAPIタイムゾーン
   * @throws UncheckedIOException Axispot設定ファイル読み取り失敗
   */
  public TimeSpatialIndexCreator(
      Path axispotConfigPath, ZoneId axispotZoneId, ZoneId digitalZensoApiZoneId) {
    this.axispotClient = new AxispotClient(axispotConfigPath);
    this.axispotZoneId = axispotZoneId;
    this.digitalZensoApiZoneId = digitalZensoApiZoneId;
  }

  /**
   * Tier4 DigitalZensoAPI vehiclesのレスポンスを格納する。
   *
   * @param inputFilePath レスポンスファイル（json）
   * @throws IllegalStateException 既にクローズ済み
   */
  public void set(Path inputFilePath) {
    VehiclesResponseParser responseParser =
        new VehiclesResponseParser(inputFilePath, digitalZensoApiZoneId, axispotZoneId);
    List<VehicleInformation> list = responseParser.toVehicleInformationList();
    for (VehicleInformation element : list) {
      axispotClient.set(element);
    }
  }

  /** Axispotとの接続をクローズする。 */
  @Override
  public void close() {
    axispotClient.close();
  }
}
