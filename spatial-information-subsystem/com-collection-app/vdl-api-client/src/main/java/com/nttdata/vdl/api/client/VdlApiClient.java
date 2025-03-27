package com.nttdata.vdl.api.client;

import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.text.MessageFormat;
import java.time.Duration;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

/**
 * VdlApiClient
 *
 * <p>Virtual datalake API gatewayを利用し、仮想データレイクを操作する。
 *
 * <p>認証は仮想データレイクが提供する認証サーバーにてトークン認証を行う。
 *
 * <p>/api/v1/data/を利用する。
 */
public class VdlApiClient {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final VdlApiConfig config;

  /**
   * 指定されたVdlApiConfigで初期化して生成する。
   *
   * @param config VdlApiConfig
   */
  public VdlApiClient(VdlApiConfig config) {
    this.config = config;
  }

  /**
   * Download the actual data
   *
   * @param vdlPath ダウンロードするデータのVDLパス
   * @return レスポンスボディ
   */
  public String get(String vdlPath) {
    try (HttpClient client = getDataHttpClient()) {
      // トークン取得
      VdlTokenResponseParser token = getToken();
      // HTTPリクエスト生成
      // -H Content-Type:application/json
      // -H X-Authentication-ID_TOKEN:${ID_TOKEN_N}
      // -H "Authorization:Bearer ${ACCESS_TOKEN_N}
      URI uri = getUri(vdlPath);
      Duration timeout = Duration.ofMillis(config.data().request().timeout());
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(uri)
              .timeout(timeout)
              .header("Content-Type", "application/json")
              .header("X-Authentication-ID_TOKEN", token.getIdToken())
              .header("Authorization", "Bearer " + token.getAccessToken())
              .GET()
              .build();
      logger.debug("GET headers={}", request.headers().toString());
      // リクエスト送信
      logger.debug("GET {}", request.uri().toString());
      HttpResponse<String> response =
          client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).join();
      logger.debug("GET body={}", response.body());

      // 2xx以外はエラー
      if (!HttpStatus.valueOf(response.statusCode()).is2xxSuccessful()) {
        throw new RuntimeException(
            MessageFormat.format("Dataの取得に失敗: response={0} {1}", response, response.body()));
      }

      return response.body();
    }
  }

  /**
   * Upload the actual data
   *
   * @param vdlPath アップロードするデータのVDLパス
   * @param dataFilePath アップロードするデータのファイルパス
   */
  public void post(String vdlPath, Path dataFilePath) {
    // VDLにアップロードするデータ
    byte[] fileBytes = null;
    try {
      fileBytes = Files.readAllBytes(dataFilePath);
    } catch (IOException e) {
      throw new RuntimeException("VDLにアップロードするファイルの読み込みに失敗", e);
    }

    try (HttpClient client = getDataHttpClient()) {
      // トークン取得
      /* NOTE:
       * 今回はVDL認証サーバーへの負荷を考慮しなくてよいため、リクエスト毎に新規トークンを取得している。
       * 負荷軽減のためにトークン管理を行う場合は、spring-boot-starter-oauth2-clientの利用を検討する。
       */
      VdlTokenResponseParser token = getToken();
      // HTTPリクエスト生成
      // -H Content-Type:application/octet-stream
      // -H X-Authentication-ID_TOKEN:${ID_TOKEN_N}
      // -H "Authorization:Bearer ${ACCESS_TOKEN_N}
      URI uri = getUri(vdlPath);
      Duration timeout = Duration.ofMillis(config.data().request().timeout());
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(uri)
              .timeout(timeout)
              .header("Content-Type", "application/octet-stream")
              .header("X-Authentication-ID_TOKEN", token.getIdToken())
              .header("Authorization", "Bearer " + token.getAccessToken())
              .POST(HttpRequest.BodyPublishers.ofByteArray(fileBytes))
              .build();
      logger.debug("POST headers={}", request.headers().toString());
      // リクエスト送信
      logger.debug("POST {}", request.uri().toString());
      HttpResponse<String> response =
          client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).join();

      // 2xx
      // 409: Conflict ※リトライ発生時にすべて格納しなおすため
      // は正常とする
      if (!HttpStatus.valueOf(response.statusCode()).is2xxSuccessful()
          && response.statusCode() != 409) {
        throw new RuntimeException(
            MessageFormat.format("Dataの作成に失敗: response={0} {1}", response, response.body()));
      }
    }
  }

  /**
   * Delete the actual data
   *
   * @param vdlPath 削除するデータのVDLパス
   */
  public void delete(String vdlPath) {
    try (HttpClient client = getDataHttpClient()) {
      // トークン取得
      VdlTokenResponseParser token = getToken();
      // HTTPリクエスト生成
      // -H X-Authentication-ID_TOKEN:${ID_TOKEN_N}
      // -H "Authorization:Bearer ${ACCESS_TOKEN_N}
      URI uri = getUri(vdlPath);
      Duration timeout = Duration.ofMillis(config.data().request().timeout());
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(uri)
              .timeout(timeout)
              .header("X-Authentication-ID_TOKEN", token.getIdToken())
              .header("Authorization", "Bearer " + token.getAccessToken())
              .DELETE()
              .build();
      logger.debug("DELETE headers={}", request.headers().toString());
      // リクエスト送信
      logger.debug("DELETE {}", request.uri().toString());
      HttpResponse<String> response =
          client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).join();

      if (!HttpStatus.valueOf(response.statusCode()).is2xxSuccessful()) {
        throw new RuntimeException(
            MessageFormat.format("Dataの作成に失敗: response={0} {1}", response, response.body()));
      }
    }
  }

  VdlTokenResponseParser getToken() {
    logger.debug("{}", config.token().request().parameters());
    URI uri = URI.create(config.token().request().endpoint());

    try (HttpClient client = getTokenHttpClient()) {
      // HTTPリクエスト生成
      // -H Content-Type:application/x-www-form-urlencoded
      Duration timeout = Duration.ofMillis(config.token().request().timeout());
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(uri)
              .timeout(timeout)
              .header("Content-Type", "application/x-www-form-urlencoded")
              .POST(createTokenBodyPublisher())
              .build();
      logger.debug("TOKEN headers={}", request.headers().toString());
      // リクエスト送信
      logger.debug("TOKEN {}", request.uri().toString());
      HttpResponse<String> response =
          client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).join();
      logger.debug("TOKEN body={}", response.body());

      // 2xx以外はエラー
      if (!HttpStatus.valueOf(response.statusCode()).is2xxSuccessful()) {
        throw new RuntimeException(
            MessageFormat.format("認証トークンの取得に失敗: response={0} {1}", response, response.body()));
      }

      VdlTokenResponseParser tokenResponse = new VdlTokenResponseParser(response.body());
      logger.debug("access_token={}", tokenResponse.getAccessToken());
      logger.debug("id_token={}", tokenResponse.getIdToken());

      return tokenResponse;
    }
  }

  HttpRequest.BodyPublisher createTokenBodyPublisher() {
    StringBuilder builder = new StringBuilder();
    // 他パラメータ
    VdlApiConfig.Token.Request.Parameters p = config.token().request().parameters();
    builder.append("client_id=").append(p.clientId()).append("&");
    builder.append("client_secret=").append(p.clientSecret()).append("&");
    builder.append("username=").append(p.username()).append("&");
    builder.append("password=").append(p.password()).append("&");
    builder.append("grant_type=").append(p.grantType()).append("&");
    builder.append("scope=").append(p.scope());

    logger.debug(builder.toString());
    return HttpRequest.BodyPublishers.ofString(builder.toString());
  }

  HttpClient getTokenHttpClient() {
    if (config.token().request().verifySsl()) {
      return HttpClient.newHttpClient();
    } else {
      return HttpClient.newBuilder().sslContext(getVerifySkipSSLContext()).build();
    }
  }

  HttpClient getDataHttpClient() {
    if (config.data().request().verifySsl()) {
      return HttpClient.newHttpClient();
    } else {
      return HttpClient.newBuilder().sslContext(getVerifySkipSSLContext()).build();
    }
  }

  SSLContext getVerifySkipSSLContext() {
    // SSL証明書の検証、および、ホストの検証をスキップするTrustManagerを利用する
    TrustManager trustManager = new NoVerifyTrustManager();
    SSLContext sslContext = getSSLContextInstance("TLS");
    initSSLContext(trustManager, sslContext);
    return sslContext;
  }

  void initSSLContext(TrustManager trustManager, SSLContext sslContext) {
    try {
      sslContext.init(null, new TrustManager[] {trustManager}, new java.security.SecureRandom());
    } catch (KeyManagementException e) {
      throw new RuntimeException(e);
    }
  }

  SSLContext getSSLContextInstance(String protocol) {
    try {
      return SSLContext.getInstance(protocol);
    } catch (NoSuchAlgorithmException e) {
      throw new RuntimeException(e);
    }
  }

  URI getBaseUri(String endpoint) {
    // 末尾がスラッシュで終わるようにしたいのでスラッシュを付与してから正規化する
    URI baseUri = URI.create(endpoint + "/").normalize();
    logger.debug("baseUri={}", baseUri.normalize());
    return baseUri;
  }

  String getVdlPath(String relativeFilePath) {
    // VDLパスの接頭語と連結して返す
    return config.data().request().vdlPathPrefix() + "/" + relativeFilePath;
  }

  URI getUri(String relativeFilePath) {
    // パスパラメーターにVDLのパス（スラッシュで開始）を指定するため意図的に"…/data//xxx/…"となるように設定する
    // 戻り値のURIを正規化（java.net.URI.normalize()）はしないこと
    // フォーマット:
    //   {ENDPOINT}/{VDL_PATH_PREFIX}/{relativeFilePath}
    // 設定例:
    //   ENDPOINT=http://localhost/api/v1/data
    //   VDL_PATH_PREFIX=/vdl-path-prefix/test
    //   relativeFilePath=dir/file.json
    // 結果:
    //   http://localhost/api/v1/data//vdl-path-prefix/test/dir/file.json
    String vdlPath = getVdlPath(relativeFilePath);
    return URI.create(getBaseUri(config.data().request().endpoint()) + vdlPath);
  }
}
