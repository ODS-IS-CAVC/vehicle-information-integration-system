package com.nttdata.vehicleinfo.collection.weatherinformationcollector.service;

import com.nttdata.vehicleinfo.collection.weatherinformationcollector.config.DreamApiConfig;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.exception.RetryableRuntimeException;
import com.nttdata.vehicleinfo.collection.weatherinformationcollector.parser.Wimage72ResponseParser;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.net.HttpURLConnection;
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
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.stereotype.Component;

/**
 * DreamApiClient
 *
 * <p>ハレックス社の提供するDreamAPIを利用し、オリジナル気象システム 「HalexDream!」を操作する。
 *
 * <p>認証はハレックス社に提供されたAPIキーをGETパラメータで送信する。そのため、警告ログやエラーログにURLが出力された際にAPIキーが含まれる。
 *
 * <p>DreamAPIの72時間dataを利用する。
 */
@Component
public class DreamApiClient {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final DreamApiConfig dreamApiConfig;

  /** 対象日時形式（1時間単位のため分は00に固定したyyyyMMddHHmm形式） */
  private final DateTimeFormatter targetDateTimeFormatter;

  /**
   * 指定された設定値で初期化して生成する。
   *
   * @param dreamApiConfig DreamApiConfig
   */
  public DreamApiClient(DreamApiConfig dreamApiConfig) {
    this.dreamApiConfig = dreamApiConfig;
    this.targetDateTimeFormatter =
        DateTimeFormatter.ofPattern("yyyyMMddHH00")
            .withZone(dreamApiConfig.wimage72().timeZoneToZoneId());
  }

  /**
   * 対象日時形式(1時間単位のため分は00に固定したyyyyMMddHHmm形式)にフォーマットする。
   *
   * @return 対象日時形式(1時間単位のため分は00に固定したyyyyMMddHHmm形式)
   */
  public String formatTargetDateTime(ZonedDateTime zonedDateTime) {
    return targetDateTimeFormatter.format(zonedDateTime);
  }

  /**
   * 指定された対象日時の72時間dataを取得する。
   *
   * @param formattedTargetDateTime 対象日時(1時間単位のため分は00に固定したyyyyMMddHHmm形式)
   */
  public void getWimage72Service(String formattedTargetDateTime) {
    // 取得する範囲が多いためリクエスト送信を並行処理する
    // 並行処理にあたりサーバーアクセスに関する注意事項に留意し以下の対策をする
    // ・スレッド数を秒間リクエスト件数と合わせる（5件/秒であれば5スレッド）
    // ・1秒以内に完了した場合は1秒経過するまで待機する

    /* 「02_72時間data.pdf」P7より引用
     *
     * ４．サーバアクセスに関する注意事項
     * ・1レスポンスあたりのデータ容量は25KB程度となります。
     * ・サーバ負荷を極力低減するため、複数の地点をまとめて要求する場合は 5件/秒程度に抑えてください。
     * ・通常、表示要求がサーバに到着してからの処理時間は1秒以内となっておりますが、
     *   データ更新タイミングやアクセス頻度の多い時間帯は、処理待ちによる遅延の発生する場合があります。
     *   タイムアウト設定時間やリトライのタイミングについては余裕を持って設定してください。
     * 　 なお、毎正時直後はアクセス頻度の多い時間帯となります。
     */

    // スレッド数は秒間リクエスト件数に合わせる
    int poolSize = dreamApiConfig.wimage72().request().perSecond();
    // 設定ファイルの座標リスト分の取得タスクを予約する
    // ※ScheduledExecutorService#close()を呼び出せば全タスクの完了まで待機する
    // ※ScheduledExecutorService#close()はtry-with-resourcesにより呼び出される
    List<DreamApiConfig.Wimage72.Request.Coordinate> coordinates =
        dreamApiConfig.wimage72().request().coordinates();
    AtomicBoolean isError = new AtomicBoolean(false);
    AtomicInteger errorCount = new AtomicInteger(0);
    try (ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(poolSize)) {
      // lat, lon以外のパラメータを設定したURLを生成
      StringBuilder commonUrlBuilder = createCommonUrlBuilder();

      for (DreamApiConfig.Wimage72.Request.Coordinate coordinate : coordinates) {
        // 72時間dataの取得タスクを登録する
        scheduler.schedule(
            () -> {
              try {
                // 開始時間を取得
                Instant start = Instant.now();
                // 期限切れのハンドリング
                handleExpired(formattedTargetDateTime);
                // リクエスト送信（リトライあり）とレスポンスのファイル保存
                executeRetryableRequestAndSave(
                    formattedTargetDateTime, commonUrlBuilder, coordinate);
                // 秒間リクエスト件数を超えないように待機
                delayIfLessThanOneSecond(start);
              } catch (Exception e) {
                isError.set(true);
                errorCount.incrementAndGet();
                String msg =
                    MessageFormat.format(
                        "72時間dataの取得失敗: targetDateTime={0}, lat={1}, lon={2}",
                        formattedTargetDateTime,
                        String.valueOf(coordinate.lat()),
                        String.valueOf(coordinate.lon()));
                logger.error(msg, e);
              }
            },
            0,
            TimeUnit.MILLISECONDS);
      }
      logger.debug("72時間data取得タスクの予約完了: {}件", coordinates.size());
    } // ScheduledExecutorService#close()が実行され予約したタスクがすべて実行完了するまで待機する
    logger.debug("72時間data取得タスクの実行完了");
    if (isError.get()) {
      String msg =
          MessageFormat.format(
              "72時間data取得タスクの実行中にエラー: error={0}件, all={1}件", errorCount.get(), coordinates.size());
      throw new RuntimeException(msg);
    }
  }

  @PostConstruct
  void init() throws IOException {
    // レスポンスファイルの保存先ディレクトリを作成
    String dir = dreamApiConfig.wimage72().response().save().directory();
    Path path = Paths.get(dir);
    Files.createDirectories(path);
  }

  void handleStatusCode(int statusCode) {
    // ステータスコード
    // 200の場合のみ成功とする
    // 3xxはHttpRequestがリダイレクトするため制御不要
    if (statusCode != HttpURLConnection.HTTP_OK) {
      // 200以外はリトライ
      String msg = MessageFormat.format("HTTPリクエスト失敗: statusCode={0}", statusCode);
      logger.warn(msg);
      throw new RetryableRuntimeException(msg);
    }
  }

  void handleErrorCode(Wimage72ResponseParser response) {
    if (response.isError()) {
      String error = response.getError();
      if (response.isRetryableError()) {
        // リトライ可能な場合
        logger.warn("エラーレスポンス: responseBody={}", response.getResponseBody());
        throw new RetryableRuntimeException(error);
      } else {
        // リトライ不可な場合
        throw new RuntimeException("エラーレスポンス: responseBody=" + response.getResponseBody());
      }
    }
  }

  void handleVersion(Wimage72ResponseParser wimage72ResponseParser, String targetVersion) {
    if (!wimage72ResponseParser.isVersionEqual(targetVersion)) {
      // バージョンが一致しない場合はリトライ
      String msg =
          MessageFormat.format(
              "バージョン不一致: targetVersion={0}, responseVersion={1}",
              targetVersion, wimage72ResponseParser.getVersion());
      logger.warn(msg);
      throw new RetryableRuntimeException(msg);
    }
  }

  void handleExpired(String formattedTargetDateTime) {
    // 現在日時を対象日時形式にフォーマット
    String nowDateTime =
        formatTargetDateTime(ZonedDateTime.now(dreamApiConfig.wimage72().timeZoneToZoneId()));
    // 現在日時と対象日時が一致しない場合は期限切れとする
    if (!nowDateTime.equals(formattedTargetDateTime)) {
      // 期限切れの場合はリトライ不可とする
      String msg =
          MessageFormat.format(
              "期限切れ: nowDateTime={0}, targetDateTime={1}", nowDateTime, formattedTargetDateTime);
      throw new RuntimeException(msg);
    }
  }

  String request(String formattedTargetDateTime, URI uri) {
    Instant start = Instant.now();
    logger.debug("リクエスト処理開始");

    try (HttpClient client = HttpClient.newHttpClient()) {
      // HTTPリクエスト生成
      Duration timeout = Duration.ofMillis(dreamApiConfig.wimage72().request().timeout());
      HttpRequest request = HttpRequest.newBuilder().uri(uri).timeout(timeout).build();

      // リクエスト送信
      logger.debug("HTTPリクエスト送信: {}", request.uri().toString());
      HttpResponse<String> response =
          client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).join();

      // ステータスコードのハンドリング
      handleStatusCode(response.statusCode());

      // エラーコードのハンドリング
      Wimage72ResponseParser wimage72ResponseParser = new Wimage72ResponseParser(response.body());
      handleErrorCode(wimage72ResponseParser);

      // バージョンのハンドリング
      handleVersion(wimage72ResponseParser, formattedTargetDateTime);

      return wimage72ResponseParser.getResponseBody();
    } finally {
      Instant end = Instant.now();
      Duration duration = Duration.between(start, end);
      logger.debug("リクエスト処理終了:  {}ms", duration.toMillis());
    }
  }

  void save(
      String formattedTargetDateTime,
      DreamApiConfig.Wimage72.Request.Coordinate coordinate,
      String responseBody) {
    String baseDir = dreamApiConfig.wimage72().response().save().directory();
    String fileName = coordinate.getFileName();
    Path filePath = Paths.get(baseDir, formattedTargetDateTime, fileName);
    logger.debug("filePath={}", filePath);
    try {
      // 例) [設定ファイルの保存先]/202409211500/lat34.8363499907_lon137.7410888671875.json
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

  StringBuilder createCommonUrlBuilder() {
    // lon,latを含めないURLを作成
    StringBuilder urlBuilder = new StringBuilder();
    urlBuilder.append(dreamApiConfig.wimage72().request().endpoint());
    urlBuilder.append("?");
    // APIキー
    urlBuilder.append("key=").append(dreamApiConfig.key()).append("&");
    // 他パラメータ
    DreamApiConfig.Wimage72.Request.Parameters p = dreamApiConfig.wimage72().request().parameters();
    urlBuilder.append("sid=").append(p.sid()).append("&");
    urlBuilder.append("rem=").append(p.rem()).append("&");
    urlBuilder.append("proj=").append(p.proj());
    return urlBuilder;
  }

  URI createUri(
      StringBuilder commonUrlBuilder, DreamApiConfig.Wimage72.Request.Coordinate coordinate) {
    StringBuilder urlBuilder = new StringBuilder(commonUrlBuilder);
    // 緯度
    urlBuilder.append("&");
    urlBuilder.append("lat=");
    urlBuilder.append(coordinate.lat());
    // 経度
    urlBuilder.append("&");
    urlBuilder.append("lon=");
    urlBuilder.append(coordinate.lon());
    return URI.create(urlBuilder.toString());
  }

  void delayIfLessThanOneSecond(Instant start) {
    // DreamAPIへの秒間リクエスト件数を超えないように処理時間が1秒以内であれば1秒まで待つ
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

  /**
   * 指定された対象日時のレスポンスを保存するファイルパスを取得する。
   *
   * @param formattedTargetDateTime 対象日時
   * @param coordinate 座標
   * @return レスポンスを保存するファイルパス
   */
  public Path getSaveFilePath(
      String formattedTargetDateTime, DreamApiConfig.Wimage72.Request.Coordinate coordinate) {
    String baseDir = dreamApiConfig.wimage72().response().save().directory();
    String fileName = coordinate.getFileName();
    Path filePath = Paths.get(baseDir, formattedTargetDateTime, fileName);
    return filePath;
  }

  void executeRetryableRequestAndSave(
      String formattedTargetDateTime,
      StringBuilder commonUrlBuilder,
      DreamApiConfig.Wimage72.Request.Coordinate coordinate) {
    try {
      // GETパラメータにlat, lonを設定
      URI uri = createUri(commonUrlBuilder, coordinate);

      // リトライ設定
      RetryTemplate retry =
          RetryTemplate.builder()
              .withTimeout(dreamApiConfig.wimage72().request().retry().timeout())
              .fixedBackoff(dreamApiConfig.wimage72().request().retry().fixedBackoff())
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
                      "DreamApiにリクエスト送信リトライ{}回目: targetDateTime={}, uri={}",
                      retryCount,
                      formattedTargetDateTime,
                      uri.toString());
                }
                // リクエスト送信
                return request(formattedTargetDateTime, uri);
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
                          "タイムアウトしたためDreamApiにリクエスト送信失敗: targetDateTime={0}",
                          formattedTargetDateTime);
                  throw new RuntimeException(msg);
                } else {
                  String msg =
                      MessageFormat.format(
                          "リトライ不可能なエラーが発生したためDreamApiにリクエスト送信失敗: targetDateTime={0}, uri={1}",
                          formattedTargetDateTime, uri.toString());
                  throw new RuntimeException(msg, recoveryContext.getLastThrowable());
                }
              });

      // レスポンスをファイルに保存
      save(formattedTargetDateTime, coordinate, responseBody);
    } catch (Exception e) {
      String msg =
          MessageFormat.format(
              "DreamApiにリクエスト送信失敗: targetDateTime={0}, lat={1}, lon={2}",
              formattedTargetDateTime,
              String.valueOf(coordinate.lat()),
              String.valueOf(coordinate.lon()));
      throw new RuntimeException(msg, e);
    }
  }
}
