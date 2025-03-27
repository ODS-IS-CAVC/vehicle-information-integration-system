package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.service;

import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.DigitalZensoApiConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.exception.RetryableRuntimeException;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.parser.VehiclesResponseParser;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.MessageFormat;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.stereotype.Component;

/**
 * DigitalZensoApiClient
 *
 * <p>Tier4の提供するDigitalZensoApiを利用し、車両情報連携システムを操作する。
 *
 * <p>DigitalZensoApiの自動運転車両モデルの全データを取得を利用する。
 */
@Component
public class DigitalZensoApiClient {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final DigitalZensoApiConfig digitalZensoApiConfig;
  private final AuthApiClient authApiClient;

  /** 対象日時形式（秒単位のためyyyyMMddHHmmss形式） */
  private final DateTimeFormatter targetDateTimeFormatter;

  /**
   * 指定された設定値で初期化して生成する。
   *
   * @param digitalZensoApiConfig DigitalZensoApiConfig
   * @param authApiClient AuthApiClient
   */
  public DigitalZensoApiClient(
      DigitalZensoApiConfig digitalZensoApiConfig, AuthApiClient authApiClient) {
    this.digitalZensoApiConfig = digitalZensoApiConfig;
    this.targetDateTimeFormatter =
        DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
            .withZone(digitalZensoApiConfig.vehicles().timeZoneToZoneId());
    this.authApiClient = authApiClient;
  }

  @PostConstruct
  void init() throws IOException {
    // レスポンスファイルの保存先ディレクトリを作成
    String dir = digitalZensoApiConfig.vehicles().response().save().directory();
    Path path = Paths.get(dir);
    Files.createDirectories(path);
  }

  /**
   * 対象日時形式（秒単位のためyyyyMMddHHmmss形式）にフォーマットする。
   *
   * @return 対象日時形式（秒単位のためyyyyMMddHHmmss形式）
   */
  public String formatTargetDateTime(ZonedDateTime zonedDateTime) {
    return targetDateTimeFormatter.format(zonedDateTime);
  }

  /**
   * 指定された対象日時の車両情報を取得する。
   *
   * @param formattedTargetDateTime 対象日時形式（秒単位のためyyyyMMddHHmmss形式）
   */
  public void getVehicles(String formattedTargetDateTime) {
    // 期限切れのハンドリング
    handleExpired(
        formattedTargetDateTime,
        ZonedDateTime.now(digitalZensoApiConfig.vehicles().timeZoneToZoneId()));
    // リクエスト送信（リトライあり）とレスポンスのファイル保存
    executeRetryableRequestAndSave(
        formattedTargetDateTime, digitalZensoApiConfig.vehicles().request().endpoint());
  }

  void handleStatusCode(int statusCode) {
    // ステータスコード
    // 3xxはHttpRequestがリダイレクトするため制御不要
    if (HttpStatus.valueOf(statusCode).is2xxSuccessful()) {
      // 2xxの場合のみ成功とする
      return;
    } else {
      String msg = MessageFormat.format("HTTPリクエスト失敗: statusCode={0}", statusCode);
      switch (statusCode) {
        case 400:
        case 401:
          // 400, 401はリトライなし
          logger.error(msg);
          throw new RuntimeException(msg);
        case 500:
        case 503:
        default:
          // 500, 503, それ以外はリトライあり
          logger.warn(msg);
          throw new RetryableRuntimeException(msg);
      }
    }
  }

  void handleErrorCode(VehiclesResponseParser response) {
    // レスポンスボディにエラーコードが返ってくることはないため何もしない
  }

  void handleVersion(VehiclesResponseParser vehiclesResponseParser, String targetVersion) {
    // レスポンスボディにバージョンが返ってくることはないため何もしない
  }

  void handleExpired(String formattedTargetDateTime, ZonedDateTime now) {
    // timeout4000ミリ秒に設定した場合を想定した場合は次のように期限切れを判定する
    // 20241126000000に開始された場合
    // now = 20241126000000 の場合: OK
    // now = 20241126000001 の場合: OK
    // now = 20241126000002 の場合: OK
    // now = 20241126000003 の場合: OK
    // now = 20241126000004 の場合: OK
    // now = 20241126000004.000000001 の場合: NG

    // 対象日時をZonedDateTimeに変換する
    ZonedDateTime target = ZonedDateTime.parse(formattedTargetDateTime, targetDateTimeFormatter);
    // timeoutナノ秒
    long timeoutNanos = digitalZensoApiConfig.vehicles().request().retry().timeoutNanos();
    // 有効日時max(対象日時からtimeoutナノ秒経過した日時)
    ZonedDateTime activeMax = target.plusNanos(timeoutNanos);
    // 現在日時が有効日時maxより後の場合は期限切れ
    if (now.isAfter(activeMax)) {
      // 期限切れの場合はリトライ不可とする
      String msg = MessageFormat.format("期限切れ: target={0}, now={1}", target, now);
      throw new RuntimeException(msg);
    }
  }

  String request(String formattedTargetDateTime, URI uri, String accessToken) {
    Instant start = Instant.now();
    logger.debug("リクエスト処理開始");

    try (HttpClient client = HttpClient.newHttpClient()) {
      // HTTPリクエスト生成
      Duration timeout = Duration.ofMillis(digitalZensoApiConfig.vehicles().request().timeout());
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(uri)
              .header("apiKey", digitalZensoApiConfig.key())
              .header("Authorization", "Bearer " + accessToken)
              .timeout(timeout)
              .build();

      // リクエスト送信
      logger.debug("HTTPリクエスト送信: {}", request.uri().toString());
      HttpResponse<String> response =
          client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).join();

      // ステータスコードのハンドリング
      handleStatusCode(response.statusCode());

      // エラーコードのハンドリング
      VehiclesResponseParser vehiclesResponseParser = new VehiclesResponseParser(response.body());
      handleErrorCode(vehiclesResponseParser);

      // バージョンのハンドリング
      handleVersion(vehiclesResponseParser, formattedTargetDateTime);

      return vehiclesResponseParser.getResponseBody();
    } finally {
      Instant end = Instant.now();
      Duration duration = Duration.between(start, end);
      logger.debug("リクエスト処理終了:  {}ms", duration.toMillis());
    }
  }

  void save(String formattedTargetDateTime, String responseBody) {
    String baseDir = digitalZensoApiConfig.vehicles().response().save().directory();
    Path filePath = getSaveFilePath(formattedTargetDateTime);
    logger.debug("filePath={}", filePath);
    try {
      // 例) [設定ファイルの保存先]/20241119000000/vehicles_20241119000000.json
      // 日時のディレクトリを作成
      Files.createDirectories(Paths.get(baseDir, formattedTargetDateTime));
      // ファイルに保存
      Files.writeString(filePath, responseBody, StandardCharsets.UTF_8);
      logger.debug("ファイル保存に成功: {}", filePath);
    } catch (IOException e) {
      String msg =
          MessageFormat.format("ファイル保存に失敗: filePath:{0}, responseBody={1}", filePath, responseBody);
      logger.error(msg, e);
      throw new RuntimeException(e);
    }
  }

  /**
   * 指定された対象日時のレスポンスを保存するファイルパスを取得する。
   *
   * @param formattedTargetDateTime 対象日時
   * @return レスポンスを保存するファイルパス
   */
  public Path getSaveFilePath(String formattedTargetDateTime) {
    String baseDir = digitalZensoApiConfig.vehicles().response().save().directory();
    return Path.of(
        baseDir,
        formattedTargetDateTime,
        MessageFormat.format("vehicles_{0}.json", formattedTargetDateTime));
  }

  void executeRetryableRequestAndSave(String formattedTargetDateTime, String endpoint) {
    try {
      URI uri = URI.create(endpoint);

      // リトライ設定
      RetryTemplate retry =
          RetryTemplate.builder()
              .withTimeout(digitalZensoApiConfig.vehicles().request().retry().timeout())
              .fixedBackoff(digitalZensoApiConfig.vehicles().request().retry().fixedBackoff())
              .retryOn(RetryableRuntimeException.class)
              .build();

      // リクエスト送信（リトライあり）
      String responseBody =
          retry.execute(
              retryContext -> {
                // リトライさせたい処理
                // リトライが発生した場合はWARNに出力
                int retryCount = retryContext.getRetryCount();
                if (retryCount > 0) {
                  logger.warn(
                      "DigitalZensoApiにリクエスト送信リトライ{}回目: targetDateTime={}, uri={}",
                      retryCount,
                      formattedTargetDateTime,
                      uri.toString());
                }

                // ユーザー認証
                String accessToken;
                if (digitalZensoApiConfig.debugAuthSkip()) {
                  logger.warn("ユーザー認証をスキップ: vehicle.tier4.digital-zenso-api.debug-auth-skip=true");
                  // NOTE: 単体テストのためにMockServerTestHelper.getLoginResponseOk()の値と一致させておく
                  accessToken = "accessToken";
                } else {
                  /* NOTE:
                   * ユーザー認証システムの仕様が不明なため、リクエスト毎に新規トークンを取得している。
                   * 負荷を考慮する場合はトークン管理を行う必要がある。
                   */
                  accessToken = authApiClient.login().getAccessToken();
                }
                // リクエスト送信
                return request(formattedTargetDateTime, uri, accessToken);
              },
              recoveryContext -> {
                // リカバリー処理
                // ※リトライができない場合に実行される
                // 　・RetryableRuntimeException以外のエラーが発生した場合
                // 　・リトライがタイムアウトした場合
                if (recoveryContext.getLastThrowable() instanceof RetryableRuntimeException) {
                  // 最後の例外がRetryableRuntimeExceptionであればタイムアウトしたと判断する
                  String msg =
                      MessageFormat.format(
                          "タイムアウトしたためDigitalZensoApiにリクエスト送信失敗: targetDateTime={0}",
                          formattedTargetDateTime);
                  throw new RuntimeException(msg);
                } else {
                  String msg =
                      MessageFormat.format(
                          "リトライ不可能なエラーが発生したためDigitalZensoApiにリクエスト送信失敗: targetDateTime={0}, uri={1}",
                          formattedTargetDateTime, uri.toString());
                  throw new RuntimeException(msg, recoveryContext.getLastThrowable());
                }
              });

      // レスポンスをファイルに保存
      save(formattedTargetDateTime, responseBody);
    } catch (Exception e) {
      String msg =
          MessageFormat.format(
              "DigitalZensoApiにリクエスト送信失敗: targetDateTime={0}", formattedTargetDateTime);
      throw new RuntimeException(msg, e);
    }
  }
}
