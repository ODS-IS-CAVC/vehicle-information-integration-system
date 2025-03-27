package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config;

import jakarta.validation.constraints.NotEmpty;
import java.net.URI;
import java.time.Duration;
import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * DigitalZensoApiConfig
 *
 * <p>設定ファイルの「vehicle.tier4.digital-zenso-api」に対応する。
 */
@Validated
@ConfigurationProperties(prefix = "vehicle.tier4.digital-zenso-api")
public record DigitalZensoApiConfig(
    @NotEmpty(message = "環境変数「VEHICLE_TIER4_DIGITAL_ZENSO_API_KEY」にて設定すること") String key,
    Vehicles vehicles,
    boolean debugAuthSkip) {

  public record Vehicles(String timeZone, Request request, Response response) {

    public record Request(String endpoint, int timeout, Retry retry) {

      public record Retry(int timeout, int fixedBackoff) {

        /**
         * timeoutのDurationインスタンスを返す。
         *
         * @return timeoutのDurationインスタンス
         */
        public Duration timeoutDuration() {
          return Duration.ofMillis(timeout);
        }

        /**
         * timeoutをナノ秒に変換して返す。
         *
         * @return timeoutのナノ秒
         */
        public long timeoutNanos() {
          return timeoutDuration().toNanos();
        }
      }

      /**
       * endpointのURIインスタンスを返す。
       *
       * @return endpointのURIインスタンス
       */
      public URI endpointUri() {
        return URI.create(endpoint());
      }

      /**
       * timeoutのDurationインスタンスを返す。
       *
       * @return timeoutのDurationインスタンス
       */
      public Duration timeoutDuration() {
        return Duration.ofMillis(timeout);
      }

      /**
       * timeoutをナノ秒に変換して返す。
       *
       * @return timeoutのナノ秒
       */
      public long timeoutNanos() {
        return timeoutDuration().toNanos();
      }
    }

    public record Response(Save save) {
      public record Save(String directory, Masking masking) {
        public record Masking(boolean enabled, String query) {}
      }
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
