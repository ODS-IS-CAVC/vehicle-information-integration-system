package com.nttdata.vehicleinfo.collection.weatherinformationcollector.config;

import com.nttdata.vdl.api.client.VdlApiConfig;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * WeatherVdlApiConfig
 *
 * <p>設定ファイルの「vdl」に対応する。
 */
@Validated
@ConfigurationProperties(prefix = "vdl")
public class WeatherVdlApiConfig {

  private VdlApiConfig api;

  public WeatherVdlApiConfig() {}

  public WeatherVdlApiConfig(VdlApiConfig api) {
    this.api = api;
  }

  public VdlApiConfig getApi() {
    return this.api;
  }

  public void setApi(VdlApiConfig api) {
    this.api = api;
  }
}
