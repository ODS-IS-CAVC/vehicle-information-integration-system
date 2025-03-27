package com.nttdata.vehicleinfo.collection.weatherinformationcollector.config;

import jakarta.validation.constraints.NotEmpty;
import java.net.URI;
import java.text.MessageFormat;
import java.time.Duration;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * DreamApiConfig
 *
 * <p>設定ファイルの「halex.dream-api」に対応する。
 */
@Validated
@ConfigurationProperties(prefix = "halex.dream-api")
public record DreamApiConfig(
    @NotEmpty(message = "環境変数「HALEX_DREAMAPI_KEY」にて設定すること") String key, Wimage72 wimage72) {

  public record Wimage72(
      String timeZone, Request request, Response response, copyForecast copyForecast) {

    public record Request(
        String endpoint,
        Parameters parameters,
        List<Coordinate> coordinates,
        int perSecond,
        int timeout,
        Retry retry) {

      public record Parameters(String sid, String rem, String proj) {}

      public record Coordinate(double lat, double lon) {

        /**
         * 座標をファイル名にフォーマットして返す。（例）lat35.73243_lon139.71547.json
         *
         * @return ファイル名
         */
        public String getFileName() {
          return MessageFormat.format(
              "lat{0}_lon{1}.json", String.valueOf(lat()), String.valueOf(lon()));
        }
      }

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
       * すべての座標のファイル名をSetで返す。
       *
       * @return 座標のファイル名のSet
       */
      public Set<String> getCoordinateFileNameAll() {
        return Optional.ofNullable(coordinates()).orElseGet(Collections::emptyList).stream()
            .map(Coordinate::getFileName)
            .collect(Collectors.toUnmodifiableSet());
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

    public record copyForecast(int days) {}

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
