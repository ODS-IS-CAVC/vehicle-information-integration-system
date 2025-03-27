package com.nttdata.vehicleinfo.collection.targetinformationcollector.config;

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
 * TargetInfoApiConfig
 *
 * <p>設定ファイルの「target.tier4.digital-zenso-api」に対応する。
 */
@Validated
@ConfigurationProperties(prefix = "target.tier4.target-info-api")
public record TargetInfoApiConfig(
    @NotEmpty(message = "環境変数「TARGET_TIER4_TARGET_INFO_API_KEY」にて設定すること") String key,
    TargetInfo targetInfo,
    boolean debugAuthSkip) {

  public record TargetInfo(String timeZone, Request request, Response response) {

    public record Request(
        String endpoint, List<Parameter> parameters, int perSecond, int timeout, Retry retry) {

      public record Parameter(String serviceLocationId, String roadsideUnitId) {

        /**
         * パラメータをファイル名にフォーマットして返す。（例）targetinfo_16777215_12345678_20241119000000.json
         *
         * @return ファイル名
         */
        public String getFileName(String formattedTargetDateTime) {
          return MessageFormat.format(
              "targetinfo_{0}_{1}_{2}.json",
              serviceLocationId(), roadsideUnitId(), formattedTargetDateTime);
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

      /**
       * すべてのパラメータのファイル名をSetで返す。
       *
       * @return ファイル名のSet
       */
      public Set<String> getParameterFileNameAll(String formattedTargetDateTime) {
        return Optional.ofNullable(parameters()).orElseGet(Collections::emptyList).stream()
            .map(parameter -> parameter.getFileName(formattedTargetDateTime))
            .collect(Collectors.toUnmodifiableSet());
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
