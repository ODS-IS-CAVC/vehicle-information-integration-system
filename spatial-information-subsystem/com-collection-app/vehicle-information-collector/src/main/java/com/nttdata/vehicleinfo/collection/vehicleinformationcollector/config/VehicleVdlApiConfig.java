package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config;

import com.nttdata.vdl.api.client.VdlApiConfig;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * VehicleVdlApiConfig
 *
 * <p>設定ファイルの「vehicle.vdl」に対応する。
 */
@Validated
@ConfigurationProperties(prefix = "vehicle.vdl")
public class VehicleVdlApiConfig {
  private VdlApiConfig api;

  public VehicleVdlApiConfig() {}

  public VehicleVdlApiConfig(VdlApiConfig api) {
    this.api = api;
  }

  public VdlApiConfig getApi() {
    return this.api;
  }

  public void setApi(VdlApiConfig api) {
    this.api = api;
  }
}
