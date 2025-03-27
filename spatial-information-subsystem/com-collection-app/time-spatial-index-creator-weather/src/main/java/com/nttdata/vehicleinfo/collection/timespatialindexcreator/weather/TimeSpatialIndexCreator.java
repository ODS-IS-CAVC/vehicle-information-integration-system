package com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather;

import com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.axispot.AxispotClient;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.weather.halex.Wimage72ResponseParser;
import java.io.Closeable;
import java.lang.invoke.MethodHandles;
import java.nio.file.Path;
import java.time.ZoneId;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 時空間ID生成ライブラリ（気象情報）
 *
 * <p>Axispot設定ファイル(.properties)のサンプル:
 *
 * <pre>
 * bitPattern=tttttttttttttttttttttttttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:38:ZFXY
 * storeNodeInfo=[REDIS_CLUSTER_HOST]:[REDIS_CLUSTER_PORT]
 * enableBulk=false
 * # 30days = 2592000sec
 * cacheTtl=2592000
 * </pre>
 */
public class TimeSpatialIndexCreator implements Closeable {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private AxispotClient axispotClient;
  private ZoneId axispotZoneId;
  private ZoneId dreamApiWimage72ZoneId;

  /**
   * 指定したAxispot設定ファイルパスが正しい場合のみ生成する。
   *
   * @param axispotConfigPath Axispot設定ファイルパス
   * @param axispotZoneId Axispotタイムゾーン
   * @param dreamApiWimage72ZoneId DreamApi72時間dataタイムゾーン
   */
  public TimeSpatialIndexCreator(
      Path axispotConfigPath, ZoneId axispotZoneId, ZoneId dreamApiWimage72ZoneId) {
    this.axispotClient = new AxispotClient(axispotConfigPath);
    this.axispotZoneId = axispotZoneId;
    this.dreamApiWimage72ZoneId = dreamApiWimage72ZoneId;
  }

  /**
   * HALEX DreamAPI 72時間dataのレスポンスを格納する。
   *
   * @param inputFilePath レスポンスファイル（json）
   * @param copyForecastDays コピー日数
   */
  public void setDreamApiWimage72(Path inputFilePath, int copyForecastDays) {
    Wimage72ResponseParser response =
        new Wimage72ResponseParser(inputFilePath, dreamApiWimage72ZoneId, axispotZoneId);
    List<WeatherInformation> list = response.toWeatherInformationList(copyForecastDays);
    for (WeatherInformation element : list) {
      axispotClient.set(element);
    }
  }

  /** Axispotとの接続をクローズする。 */
  @Override
  public void close() {
    axispotClient.close();
  }
}
