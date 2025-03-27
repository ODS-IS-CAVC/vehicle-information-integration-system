package com.nttdata.vehicleinfo.collection.weatherinformationcollector.service;

import com.nttdata.vdl.api.client.VdlApiClient;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.config.WeatherVdlApiConfig;
import org.springframework.stereotype.Component;

/**
 * WeatherVdlApiClient
 *
 * <p>vdl-api-clientを利用する。
 */
@Component
public class WeatherVdlApiClient {
  private final VdlApiClient vdlApiClient;

  /**
   * 指定された設定値で初期化して生成する。
   *
   * @param weatherVdlApiConfig WeatherVdlApiConfig
   */
  public WeatherVdlApiClient(WeatherVdlApiConfig weatherVdlApiConfig) {
    this.vdlApiClient = new VdlApiClient(weatherVdlApiConfig.getApi());
  }

  /**
   * 仮想データレイクAPIクライアントを返す。
   *
   * @return 仮想データレイクAPIクライアント
   */
  public VdlApiClient getVdlApiClient() {
    return vdlApiClient;
  }
}
