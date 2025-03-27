package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config;

import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * ApplicationConfig
 *
 * <p>設定ファイルの「application」に対応する。
 */
@ConfigurationProperties(prefix = "application")
public record ApplicationConfig(String timeZone, Scheduler scheduler) {

  public record Scheduler(String cron, String timeZone) {}

  /**
   * timeZoneのZoneIdを取得する。
   *
   * @return timeZoneのZoneId
   */
  public ZoneId timeZoneToZoneId() {
    return ZoneId.of(timeZone());
  }
}
