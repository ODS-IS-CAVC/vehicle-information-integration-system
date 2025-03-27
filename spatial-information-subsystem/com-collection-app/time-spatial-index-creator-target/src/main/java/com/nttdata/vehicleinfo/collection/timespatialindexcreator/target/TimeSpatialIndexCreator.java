package com.nttdata.vehicleinfo.collection.timespatialindexcreator.target;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.axispot.AxispotClient;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.tier4.TargetInfoResponseParser;
import java.io.Closeable;
import java.lang.invoke.MethodHandles;
import java.nio.file.Path;
import java.time.ZoneId;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 時空間ID生成ライブラリ（物標情報）
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
  private ZoneId taegetInfoApiZoneId;

  /**
   * 指定したAxispot設定ファイルパスが正しい場合のみ生成する。
   *
   * @param axispotConfigPath Axispot設定ファイルパス
   * @param axispotZoneId Axispotタイムゾーン
   * @param taegetInfoApiZoneId TargetInfoAPIタイムゾーン
   */
  public TimeSpatialIndexCreator(
      Path axispotConfigPath, ZoneId axispotZoneId, ZoneId taegetInfoApiZoneId) {
    this.axispotClient = new AxispotClient(axispotConfigPath);
    this.axispotZoneId = axispotZoneId;
    this.taegetInfoApiZoneId = taegetInfoApiZoneId;
  }

  /**
   * Tier4 TargetInfoApi targetInfoのレスポンスを格納する。
   *
   * @param inputFilePath レスポンスファイル（json）
   */
  public void set(Path inputFilePath) {
    TargetInfoResponseParser responseParser =
        new TargetInfoResponseParser(inputFilePath, taegetInfoApiZoneId, axispotZoneId);
    List<TargetInformation> list = responseParser.toTargetInformationList();
    for (TargetInformation element : list) {
      axispotClient.set(element);
    }
  }

  /** Axispotとの接続をクローズする。 */
  @Override
  public void close() {
    axispotClient.close();
  }
}
