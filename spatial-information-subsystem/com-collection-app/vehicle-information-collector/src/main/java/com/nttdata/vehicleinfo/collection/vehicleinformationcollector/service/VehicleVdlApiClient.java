package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.service;

import com.nttdata.vdl.api.client.VdlApiClient;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.VehicleVdlApiConfig;
import org.springframework.stereotype.Component;

/**
 * VehicleVdlApiClient
 *
 * <p>vdl-api-clientを利用する。
 */
@Component
public class VehicleVdlApiClient {
  private final VdlApiClient vdlApiClient;

  /**
   * 指定された設定値で初期化して生成する。
   *
   * @param vehicleVdlApiConfig VehicleVdlApiConfig
   */
  public VehicleVdlApiClient(VehicleVdlApiConfig vehicleVdlApiConfig) {
    this.vdlApiClient = new VdlApiClient(vehicleVdlApiConfig.getApi());
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
