package com.nttdata.vehicleinfo.collection.targetinformationcollector.service;

import com.nttdata.vdl.api.client.VdlApiClient;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.config.TargetVdlApiConfig;
import org.springframework.stereotype.Component;

/**
 * TargetVdlApiClient
 *
 * <p>vdl-api-clientを利用する。
 */
@Component
public class TargetVdlApiClient {
  private final VdlApiClient vdlApiClient;

  /**
   * 指定された設定値で初期化して生成する。
   *
   * @param targetVdlApiConfig TargetVdlApiConfig
   */
  public TargetVdlApiClient(TargetVdlApiConfig targetVdlApiConfig) {
    this.vdlApiClient = new VdlApiClient(targetVdlApiConfig.getApi());
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
