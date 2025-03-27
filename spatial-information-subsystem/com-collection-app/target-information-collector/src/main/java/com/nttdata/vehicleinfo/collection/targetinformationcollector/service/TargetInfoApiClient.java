package com.nttdata.vehicleinfo.collection.targetinformationcollector.service;

import com.nttdata.vehicleinfo.collection.targetinformationcollector.config.TargetInfoApiConfig;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.exception.RetryableRuntimeException;
import com.nttdata.vehicleinfo.collection.targetinformationcollector.parser.TargetInfoResponseParser;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URLEncoder;
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
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.stereotype.Component;

/**
 * TargetInfoApiClient
 *
 * <p>Tier4の提供する環境情報連携システムAPIを利用し、環境情報連携システムを操作する。
 *
 * <p>環境情報連携システムAPIの/targetInfoを利用する。
 */
@Component
public class TargetInfoApiClient {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final TargetInfoApiConfig targetInfoApiConfig;
  private final AuthApiClient authApiClient;

  /** 対象日時形式（秒単位のためyyyyMMddHHmmss形式） */
  private final DateTimeFormatter targetDateTimeFormatter;

  /**
   * 指定された設定値で初期化して生成する。
   *
   * @param targetInfoApiConfig TargetInfoApiConfig
   * @param authApiClient AuthApiClient
   */
  public TargetInfoApiClient(TargetInfoApiConfig targetInfoApiConfig, AuthApiClient authApiClient) {
    this.targetInfoApiConfig = targetInfoApiConfig;
    this.targetDateTimeFormatter =
        DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
            .withZone(targetInfoApiConfig.targetInfo().timeZoneToZoneId());
    this.authApiClient = authApiClient;
  }

  @PostConstruct
  void init() throws IOException {
    // レスポンスファイルの保存先ディレクトリを作成
    String dir = targetInfoApiConfig.targetInfo().response().save().directory();
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

  /** GETパラメータのキー */
  public static class GetParameters {
    public static final String SERVICE_LOCATION_ID = "serviceLocationID";
    public static final String ROADSIDE_UNIT_ID = "roadsideUnitID";
  }

  /**
   * 指定したパラメータのURIインスタンスを生成する。
   *
   * @param endpoint endpoint
   * @param serviceLocationId serviceLocationId
   * @param roadsideUnitId roadsideUnitId
   * @return 指定したパラメータのURIインスタンス
   */
  public URI createUri(String endpoint, String serviceLocationId, String roadsideUnitId) {
    String uri =
        new StringBuilder()
            .append(endpoint)
            .append("?")
            .append(GetParameters.SERVICE_LOCATION_ID)
            .append("=")
            .append(URLEncoder.encode(serviceLocationId, StandardCharsets.UTF_8))
            .append("&")
            .append(GetParameters.ROADSIDE_UNIT_ID)
            .append("=")
            .append(URLEncoder.encode(roadsideUnitId, StandardCharsets.UTF_8))
            .toString();
    return URI.create(uri);
  }

  /**
   * 指定された対象日時の物標情報を取得する。
   *
   * @param formattedTargetDateTime 対象日時形式（秒単位のためyyyyMMddHHmmss形式）
   */
  public void getTargetInfo(String formattedTargetDateTime) {
    // 複数のパラメータを設定可能なためリクエスト送信を並行処理する
    // 並行処理にあたりサーバーアクセスに関する注意事項に留意し以下の対策をする
    // ・スレッド数を秒間リクエスト件数と合わせる（5件/秒であれば5スレッド）
    // ・1秒以内に完了した場合は1秒経過するまで待機する

    // スレッド数は秒間リクエスト件数に合わせる
    int poolSize = targetInfoApiConfig.targetInfo().request().perSecond();
    // 設定ファイルの座標リスト分の取得タスクを予約する
    // ※ScheduledExecutorService#close()を呼び出せば全タスクの完了まで待機する
    // ※ScheduledExecutorService#close()はtry-with-resourcesにより呼び出される
    List<TargetInfoApiConfig.TargetInfo.Request.Parameter> parameters =
        targetInfoApiConfig.targetInfo().request().parameters();
    AtomicBoolean isError = new AtomicBoolean(false);
    AtomicInteger errorCount = new AtomicInteger(0);
    try (ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(poolSize)) {
      // ベースにするURL
      String baseUrl = targetInfoApiConfig.targetInfo().request().endpoint();

      for (TargetInfoApiConfig.TargetInfo.Request.Parameter parameter : parameters) {
        // 物標情報取得タスクを登録する
        scheduler.schedule(
            () -> {
              try {
                // 開始時間を取得
                ZonedDateTime start =
                    ZonedDateTime.now(targetInfoApiConfig.targetInfo().timeZoneToZoneId());
                // 期限切れのハンドリング
                handleExpired(formattedTargetDateTime, start);
                // リクエスト送信（リトライあり）とレスポンスのファイル保存
                executeRetryableRequestAndSave(
                    formattedTargetDateTime,
                    baseUrl,
                    parameter.serviceLocationId(),
                    parameter.roadsideUnitId());
                // 秒間リクエスト件数を超えないように待機
                delayIfLessThanOneSecond(start.toInstant());
              } catch (Exception e) {
                isError.set(true);
                errorCount.incrementAndGet();
                String msg =
                    MessageFormat.format(
                        "物標情報の取得失敗: targetDateTime={0}, serviceLocationID={1}, roadsideUnitID={2}",
                        formattedTargetDateTime,
                        parameter.serviceLocationId(),
                        parameter.roadsideUnitId());
                logger.error(msg, e);
              }
            },
            0,
            TimeUnit.MILLISECONDS);
      }
      logger.debug("物標情報取得タスクの予約完了: {}件", parameters.size());
    } // ScheduledExecutorService#close()が実行され予約したタスクがすべて実行完了するまで待機する
    logger.debug("物標情報取得タスクの実行完了");
    if (isError.get()) {
      String msg =
          MessageFormat.format(
              "物標情報取得タスクの実行中にエラー: error={0}件, all={1}件", errorCount.get(), parameters.size());
      throw new RuntimeException(msg);
    }
  }

  void handleStatusCode(int statusCode) {
    // ステータスコード
    // 3xxはHttpRequestがリダイレクトするため制御不要

    // OKかを判定
    if (HttpStatus.valueOf(statusCode).is2xxSuccessful()) {
      // 2xxの場合のみ成功とする
      return;
    } else {
      // それ以外はエラーとする
      // OpenApi仕様書に記載のあるものだけハンドリング

      // エラーの場合はwarnログを出力
      String msg = MessageFormat.format("HTTPリクエスト失敗: statusCode={0}", statusCode);
      logger.warn(msg);
      // リトライ有無を判定
      switch (statusCode) {
        case HttpURLConnection.HTTP_BAD_REQUEST:
          // 400はリトライなし
          throw new RuntimeException(msg);
        case HttpURLConnection.HTTP_INTERNAL_ERROR:
          // 500はリトライあり
          throw new RetryableRuntimeException(msg);
        default:
          // それ以外はリトライあり
          throw new RetryableRuntimeException(msg);
      }
    }
  }

  void handleErrorCode(TargetInfoResponseParser response) {
    // レスポンスボディにエラーコードが返ってくることはないため何もしない
  }

  void handleVersion(TargetInfoResponseParser targetInfoResponseParser, String targetVersion) {
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
    long timeoutNanos = targetInfoApiConfig.targetInfo().request().retry().timeoutNanos();
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
      Duration timeout = Duration.ofMillis(targetInfoApiConfig.targetInfo().request().timeout());
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(uri)
              .header("apiKey", targetInfoApiConfig.key())
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
      TargetInfoResponseParser targetInfoResponseParser =
          new TargetInfoResponseParser(response.body());
      handleErrorCode(targetInfoResponseParser);

      // バージョンのハンドリング
      handleVersion(targetInfoResponseParser, formattedTargetDateTime);

      return targetInfoResponseParser.getResponseBody();
    } finally {
      Instant end = Instant.now();
      Duration duration = Duration.between(start, end);
      logger.debug("リクエスト処理終了:  {}ms", duration.toMillis());
    }
  }

  void save(
      String formattedTargetDateTime,
      String serviceLocationId,
      String roadsideUnitId,
      String responseBody) {
    String baseDir = targetInfoApiConfig.targetInfo().response().save().directory();
    Path filePath = getSaveFilePath(formattedTargetDateTime, serviceLocationId, roadsideUnitId);
    logger.debug("filePath={}", filePath);
    try {
      // 例) [設定ファイルの保存先]/20180124102526/targetinfo_16777215_12345678_20180124102526.json
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
   * @param serviceLocationId サービス地点ID
   * @param roadsideUnitId 路側機ID
   * @return レスポンスを保存するファイルパス
   */
  public Path getSaveFilePath(
      String formattedTargetDateTime, String serviceLocationId, String roadsideUnitId) {
    String baseDir = targetInfoApiConfig.targetInfo().response().save().directory();
    return Path.of(
        baseDir,
        formattedTargetDateTime,
        MessageFormat.format(
            "targetinfo_{0}_{1}_{2}.json",
            serviceLocationId, roadsideUnitId, formattedTargetDateTime));
  }

  void executeRetryableRequestAndSave(
      String formattedTargetDateTime,
      String endpoint,
      String serviceLocationId,
      String roadsideUnitId) {
    try {
      URI uri = createUri(endpoint, serviceLocationId, roadsideUnitId);

      // リトライ設定
      RetryTemplate retry =
          RetryTemplate.builder()
              .withTimeout(targetInfoApiConfig.targetInfo().request().retry().timeout())
              .fixedBackoff(targetInfoApiConfig.targetInfo().request().retry().fixedBackoff())
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
                      "TargetInfoApiにリクエスト送信リトライ{}回目: targetDateTime={}, uri={}",
                      retryCount,
                      formattedTargetDateTime,
                      uri.toString());
                }

                // ユーザー認証
                String accessToken;
                if (targetInfoApiConfig.debugAuthSkip()) {
                  logger.warn("ユーザー認証をスキップ: target.tier4.target-info-api.debug-auth-skip=true");
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
                          "タイムアウトしたためTargetInfoApiにリクエスト送信失敗: targetDateTime={0}",
                          formattedTargetDateTime);
                  throw new RuntimeException(msg);
                } else {
                  String msg =
                      MessageFormat.format(
                          "リトライ不可能なエラーが発生したためTargetInfoApiにリクエスト送信失敗: targetDateTime={0}, uri={1}",
                          formattedTargetDateTime, uri.toString());
                  throw new RuntimeException(msg, recoveryContext.getLastThrowable());
                }
              });

      // レスポンスをファイルに保存
      save(formattedTargetDateTime, serviceLocationId, roadsideUnitId, responseBody);
    } catch (Exception e) {
      String msg =
          MessageFormat.format(
              "TargetInfoApiにリクエスト送信失敗: targetDateTime={0}", formattedTargetDateTime);
      throw new RuntimeException(msg, e);
    }
  }

  void delayIfLessThanOneSecond(Instant start) {
    // 秒間リクエスト件数を超えないように処理時間が1秒以内であれば1秒まで待つ
    Instant end = Instant.now();
    Duration duration = Duration.between(start, end);
    logger.debug("リクエストと格納処理の処理時間{}ms", duration.toMillis());
    long diff = 1000 - duration.toMillis();
    if (diff > 0) {
      try {
        logger.debug("リクエストと格納処理の処理時間{}msのため{}ms待機", duration.toMillis(), diff);
        Thread.sleep(diff);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new RuntimeException("処理中断", e);
      }
    }
  }
}
