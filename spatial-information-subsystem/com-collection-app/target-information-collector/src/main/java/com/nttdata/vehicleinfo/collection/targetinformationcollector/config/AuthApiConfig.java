package com.nttdata.vehicleinfo.collection.targetinformationcollector.config;

import jakarta.validation.constraints.NotEmpty;
import java.net.URI;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * AxispotConfig
 *
 * <p>設定ファイルの「target.auth-api」に対応する。
 */
@ConfigurationProperties(prefix = "target.auth-api")
public record AuthApiConfig(Login login) {

  public record Login(
      @NotEmpty(message = "環境変数「TARGET_AUTH_API_LOGIN_KEY」にて設定すること") String key, Request request) {
    public record Request(String endpoint, Parameters parameters, int timeout) {
      public record Parameters(
          @NotEmpty(
                  message =
                      "環境変数「TARGET_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID」にて設定すること")
              String operatorAccountId,
          @NotEmpty(
                  message =
                      "環境変数「TARGET_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD」にて設定すること")
              String accountPassword) {}

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
  }
}
