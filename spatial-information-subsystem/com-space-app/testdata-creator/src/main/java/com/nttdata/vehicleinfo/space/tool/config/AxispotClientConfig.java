package com.nttdata.vehicleinfo.space.tool.config;

import jp.co.ntt.sic.Geotemp;
import jp.co.ntt.sic.config.BitPattern;
import jp.co.ntt.sic.config.GeotempConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** AxispotのクライアントであるGeotempをDIコンテナに登録するためのConfigurationクラス. */
@Configuration
public class AxispotClientConfig {

  private final AxispotConfig axispotConfig;

  public AxispotClientConfig(AxispotConfig axispotConfig) {
    this.axispotConfig = axispotConfig;
  }

  /**
   * 気象情報が格納されたAxispotに接続するGeotempオブジェクトを返却する.
   *
   * @return 気象情報向けのGeotempオブジェクト
   */
  @Bean
  public Geotemp geotemp() {
    GeotempConfig config =
        new GeotempConfig(
            axispotConfig.storeNodeInfo(), BitPattern.parseString(axispotConfig.bitPattern()));
    config.setCacheTtl(axispotConfig.cacheTtl());
    return new Geotemp(config);
  }
}
