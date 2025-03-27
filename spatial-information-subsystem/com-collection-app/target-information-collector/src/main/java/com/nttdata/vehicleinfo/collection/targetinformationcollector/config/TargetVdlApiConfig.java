package com.nttdata.vehicleinfo.collection.targetinformationcollector.config;

import com.nttdata.vdl.api.client.VdlApiConfig;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * TargetVdlApiConfig
 *
 * <p>設定ファイルの「target.vdl」に対応する。
 */
@Validated
@ConfigurationProperties(prefix = "target.vdl")
public class TargetVdlApiConfig {
  private VdlApiConfig api;

  public TargetVdlApiConfig() {}

  public TargetVdlApiConfig(VdlApiConfig api) {
    this.api = api;
  }

  public VdlApiConfig getApi() {
    return this.api;
  }

  public void setApi(VdlApiConfig api) {
    this.api = api;
  }
}
