package com.nttdata.vdl.api.client;

import jakarta.validation.constraints.NotEmpty;
import java.time.Duration;
import org.springframework.validation.annotation.Validated;

@Validated
public record VdlApiConfig(Token token, Data data) {

  public record Token(Request request) {

    public record Request(String endpoint, Parameters parameters, int timeout, boolean verifySsl) {
      public record Parameters(
          String clientId,
          @NotEmpty(message = "環境変数に仮想データレイクから発行されるクライアントシークレットを設定すること") String clientSecret,
          String username,
          @NotEmpty(message = "環境変数に仮想データレイクから発行されるパスワードを設定すること") String password,
          String grantType,
          String scope) {}

      public Duration timeoutDuration() {
        return Duration.ofMillis(timeout);
      }

      public long timeoutNanos() {
        return timeoutDuration().toNanos();
      }
    }
  }

  public record Data(Request request) {

    public record Request(
        String endpoint, String vdlPathPrefix, int timeout, boolean verifySsl, Retry retry) {

      public Duration timeoutDuration() {
        return Duration.ofMillis(timeout);
      }

      public long timeoutNanos() {
        return timeoutDuration().toNanos();
      }

      public record Retry(int timeout, int fixedBackoff) {}
    }
  }
}
