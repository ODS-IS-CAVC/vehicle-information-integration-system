package com.nttdata.vehicleinfo.space.search.config;

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
   * 車両プローブ情報および物標情報が格納されたAxispotに対するGeotempConfigオブジェクトを返却します.
   *
   * @return 車両プローブ情報および物標情報向けのGeotempConfigオブジェクト
   */
  @Bean
  public GeotempConfig geotempConfig() {
    return new GeotempConfig(
        axispotConfig.storeNodeInfo(), BitPattern.parseString(axispotConfig.bitPattern()));
  }

  /**
   * 車両プローブ情報および物標情報が格納されたAxispotに接続するGeotempオブジェクトを返却します.
   *
   * @return 車両プローブ情報および物標情報向けのGeotempオブジェクト
   */
  @Bean
  public Geotemp geotemp() {
    return new Geotemp(geotempConfig());
  }
}
