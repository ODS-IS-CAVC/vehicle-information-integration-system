package com.nttdata.vdl.api.client.test;

import com.nttdata.vdl.api.client.VdlApiClient;
import org.springframework.stereotype.Component;

@Component
public class TestVdApiClient {
  private final VdlApiClient vdlApiClient;

  public TestVdApiClient(TestVdlApiConfig testVdlApiConfig) {
    this.vdlApiClient = new VdlApiClient(testVdlApiConfig.getApi());
  }

  public VdlApiClient getVdlApiClient() {
    return vdlApiClient;
  }
}
