package com.nttdata.vdl.api.client.test;

import com.nttdata.vdl.api.client.VdlApiConfig;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "vdl")
public class TestVdlApiConfig {

  private VdlApiConfig api;

  public TestVdlApiConfig() {}

  public TestVdlApiConfig(VdlApiConfig api) {
    this.api = api;
  }

  public VdlApiConfig getApi() {
    return this.api;
  }

  public void setApi(VdlApiConfig api) {
    this.api = api;
  }
}
