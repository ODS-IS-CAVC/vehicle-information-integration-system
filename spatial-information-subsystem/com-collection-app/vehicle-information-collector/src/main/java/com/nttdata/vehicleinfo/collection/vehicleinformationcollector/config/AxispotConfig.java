package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config;

import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * AxispotConfig
 *
 * <p>設定ファイルの「vehicle.axispot」に対応する。
 */
@ConfigurationProperties(prefix = "vehicle.axispot")
public record AxispotConfig(Geotemp geotemp) {

  public record Geotemp(String timeZone, String config, Save save) {

    public record Save(Retry retry) {

      public record Retry(int timeout, int fixedBackoff) {}
    }

    /**
     * timeZoneのZoneIdを取得する。
     *
     * @return timeZoneのZoneId
     */
    public ZoneId timeZoneToZoneId() {
      return ZoneId.of(timeZone());
    }
  }
}
