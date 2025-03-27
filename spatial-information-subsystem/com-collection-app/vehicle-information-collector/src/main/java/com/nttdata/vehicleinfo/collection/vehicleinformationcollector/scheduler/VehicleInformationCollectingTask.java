package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.scheduler;

import com.nttdata.vdl.api.client.VdlApiClient;
import com.nttdata.vdl.api.client.VdlApiConfig;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.TimeSpatialIndexCreator;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.ApplicationConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.AxispotConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.DigitalZensoApiConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.config.VehicleVdlApiConfig;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.exception.RetryableRuntimeException;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.masking.MaskingUtil;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.service.DigitalZensoApiClient;
import com.nttdata.vehicleinfo.collection.vehicleinformationcollector.service.VehicleVdlApiClient;
import java.io.File;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.text.MessageFormat;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 車両情報収集タスク
 *
 * <p>定期実行はSpringBootのScheduling機能にて管理する。
 *
 * <p>本タスクは、Tier4から車両情報を取得し、Axispotおよび仮想データレイクに格納する。
 *
 * <p>すべての格納に成功した場合は、ファイルに保存した車両情報を削除する。
 *
 * <p>いずれかの格納に失敗した場合は、ファイルに保存した車両情報を残しておく。
 */
@Component
public class VehicleInformationCollectingTask {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final ApplicationConfig applicationConfig;
  private final AxispotConfig axispotConfig;
  private final DigitalZensoApiConfig digitalZensoApiConfig;
  private final DigitalZensoApiClient digitalZensoApiClient;
  private final VdlApiClient vdlApiClient;
  private final VdlApiConfig vdlApiConfig;

  /**
   * 指定された設定値で初期化して生成する。
   *
   * @param applicationConfig ApplicationConfig
   * @param axispotConfig AxispotConfig
   * @param digitalZensoApiConfig DigitalZensoApiConfig
   * @param digitalZensoApiClient DigitalZensoApiClient
   * @param vehicleVdlApiClient VehicleVdlApiClient
   * @param vehicleVdlApiConfig VehicleVdlApiConfig
   */
  public VehicleInformationCollectingTask(
      ApplicationConfig applicationConfig,
      AxispotConfig axispotConfig,
      DigitalZensoApiConfig digitalZensoApiConfig,
      DigitalZensoApiClient digitalZensoApiClient,
      VehicleVdlApiClient vehicleVdlApiClient,
      VehicleVdlApiConfig vehicleVdlApiConfig) {
    this.applicationConfig = applicationConfig;
    this.axispotConfig = axispotConfig;
    this.digitalZensoApiConfig = digitalZensoApiConfig;
    this.digitalZensoApiClient = digitalZensoApiClient;
    this.vdlApiClient = vehicleVdlApiClient.getVdlApiClient();
    this.vdlApiConfig = vehicleVdlApiConfig.getApi();
  }

  /** 定期実行処理 */
  @Scheduled(cron = "${application.scheduler.cron}", zone = "${application.scheduler.zone}")
  public void execute() {
    // 開始日時を取得
    ZonedDateTime start = ZonedDateTime.now(applicationConfig.timeZoneToZoneId());
    logger.info("start: {}", start);

    // DigitalZensoApiの対象日時形式にフォーマット
    String formattedTargetDateTime = digitalZensoApiClient.formatTargetDateTime(start);
    logger.info("formattedTargetDateTime: {}", formattedTargetDateTime);

    try {
      // DigitalZensoApiから車両情報を取得
      digitalZensoApiClient.getVehicles(formattedTargetDateTime);

      // マスク処理
      applyMask(formattedTargetDateTime);

      // Axispotに格納する
      saveRetryableToAxispot(formattedTargetDateTime);

      // 仮想データレイクに格納する
      saveRetryableToVdl(formattedTargetDateTime);

      // レスポンスファイルを削除する
      cleanUp(formattedTargetDateTime);
    } catch (Exception e) {
      logger.error("車両情報収集に失敗", e);
    }
    // 終了日時を取得
    ZonedDateTime end = ZonedDateTime.now(applicationConfig.timeZoneToZoneId());
    logger.info("end: {}", end);
    Duration duration = Duration.between(start, end);
    logger.info("total time: {}ms", duration.toMillis());
  }

  void cleanUp(String formattedTargetDateTime) {
    // 対象日時のフォルダを削除する
    try {
      String baseDir = digitalZensoApiConfig.vehicles().response().save().directory();
      Path saveDirPath = Paths.get(baseDir, formattedTargetDateTime);
      try (Stream<Path> paths = Files.walk(saveDirPath)) {
        paths
            .sorted(Comparator.reverseOrder())
            .forEach(
                path -> {
                  try {
                    Files.delete(path);
                  } catch (IOException e) {
                    throw new RuntimeException(e);
                  }
                });
      }
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  void applyMask(String formattedTargetDateTime) {
    // マスク処理が有効な場合のみ
    if (digitalZensoApiConfig.vehicles().response().save().masking().enabled()) {
      try {
        // NOTE:
        // 車両情報は1回のリクエストで全件取得可能なため1ファイルのみとなる。
        // もし複数リクエストが必要になる場合でも本メソッドは複数ファイルに対応しているため変更不要である。

        // 対象日時ディレクトリにバックアップディレクトリを作成する。
        // 全ファイルをバックアップ（コピー）する。
        // 全ファイルのマスク処理を実施する。
        // もし、いずれかの処理中に例外が発生した場合はマスク処理失敗としてエラーログを出力して例外を投げる。

        // 処理前と処理後のフォルダ構成は以下の通り。
        // 処理前:
        //   [対象日時ディレクトリ]
        //     |- file1.json
        //     |- file2.json
        //     |- file3.json
        // 処理後:
        //   [対象日時ディレクトリ]
        //     |- backup ※新規作成
        //     |   |- file1.json ※マスキングなし
        //     |   |- file2.json ※マスキングなし
        //     |   |- file3.json ※マスキングなし
        //     |- file1.json ※マスキングあり
        //     |- file2.json ※マスキングあり
        //     |- file3.json ※マスキングあり

        // 対象日時ディレクトリ配下にバックアップディレクトリを作成
        Path backupDirPath =
            Paths.get(
                digitalZensoApiConfig.vehicles().response().save().directory(),
                formattedTargetDateTime,
                "backup");
        Files.createDirectories(backupDirPath);
        // jqクエリを取得
        String query = digitalZensoApiConfig.vehicles().response().save().masking().query();
        // レスポンスファイルリストを取得
        List<File> fileList = getResponseFileList(formattedTargetDateTime);
        // 全ファイルのマスク前のデータをbackupにコピー
        for (File file : fileList) {
          Path backupFilePath = backupDirPath.resolve(file.getName());
          Files.copy(file.toPath(), backupFilePath, StandardCopyOption.REPLACE_EXISTING);
        }
        // 全ファイルにマスク処理を実行
        for (File file : fileList) {
          // バックアップしたファイルからデータを読み込み、マスク処理を実施した結果を元ファイルに上書き
          Path backupFilePath = backupDirPath.resolve(file.getName());
          MaskingUtil.applyToFile(backupFilePath.toFile(), query, file);
        }
      } catch (Exception e) {
        // エラーログを出力して例外をスロー
        logger.error("マスク処理に失敗", e);
        throw new RuntimeException("マスク処理に失敗", e);
      }
    }
  }

  void saveRetryableToAxispot(String formattedTargetDateTime) {
    // リトライ設定
    RetryTemplate retry =
        RetryTemplate.builder()
            .withTimeout(axispotConfig.geotemp().save().retry().timeout())
            .fixedBackoff(axispotConfig.geotemp().save().retry().fixedBackoff())
            .retryOn(RetryableRuntimeException.class)
            .build();

    // Axispotに格納（リトライあり）
    retry.execute(
        retryContext -> {
          // リトライさせたい処理
          // リトライが発生した場合はWARNに出力
          int retryCount = retryContext.getRetryCount();
          if (retryCount > 0) {
            logger.warn(
                "Axispotに格納リトライ{}回目: targetDateTime={}", retryCount, formattedTargetDateTime);
          }

          // Axispotに格納
          /* NOTE:
           * ・原因に関係なくリトライする（行儀はよくないが内部連携のため許容する）
           * ・リトライが発生した場合は最初から格納しなおす（行儀はよくないが内部連携のため許容する）
           * 　※リトライによって同一のデータを格納した場合もKeyのTTLは再設定されるため新規格納時との違いはない
           */
          try {
            saveToAxispot(formattedTargetDateTime);
          } catch (Exception e) {
            String msg =
                MessageFormat.format("Axispotに格納失敗: targetDateTime={0}", formattedTargetDateTime);
            logger.error(msg, e);
            throw new RetryableRuntimeException(e);
          }

          return null;
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
                    "タイムアウトしたためAxispotに格納失敗: targetDateTime={0}", formattedTargetDateTime);
            throw new RuntimeException(msg);
          } else {
            // 原因に関係なくリトライしているため到達不可能である
            String msg =
                MessageFormat.format(
                    "リトライ不可能なエラーが発生したためAxispotに格納失敗: targetDateTime={0}", formattedTargetDateTime);
            throw new RuntimeException(msg, recoveryContext.getLastThrowable());
          }
        });
  }

  void saveToAxispot(String formattedTargetDateTime) {
    // Axispot設定ファイルのパス
    Path geotempConfigPath = Paths.get(axispotConfig.geotemp().config());
    // インデックス生成ライブラリの準備
    try (TimeSpatialIndexCreator creator =
        new TimeSpatialIndexCreator(
            geotempConfigPath,
            axispotConfig.geotemp().timeZoneToZoneId(),
            digitalZensoApiConfig.vehicles().timeZoneToZoneId())) {
      // 設定ファイルに記述された座標のレスポンスファイルリストを取得
      List<File> fileList = getResponseFileList(formattedTargetDateTime);

      for (File file : fileList) {
        // Axispotに格納
        creator.set(file.toPath());
      }
    }
  }

  void saveRetryableToVdl(String formattedTargetDateTime) {
    // リトライ設定
    RetryTemplate retry =
        RetryTemplate.builder()
            .withTimeout(vdlApiConfig.data().request().retry().timeout())
            .fixedBackoff(vdlApiConfig.data().request().retry().fixedBackoff())
            .retryOn(RetryableRuntimeException.class)
            .build();

    // VDLに格納（リトライあり）
    retry.execute(
        retryContext -> {
          // リトライさせたい処理
          // リトライが発生した場合はWARNに出力
          int retryCount = retryContext.getRetryCount();
          if (retryCount > 0) {
            logger.warn("VDLに格納リトライ{}回目: targetDateTime={}", retryCount, formattedTargetDateTime);
          }

          // VDLに格納
          /* NOTE:
           * ・原因に関係なくリトライする（行儀はよくないが内部連携のため許容する）
           * ・リトライが発生した場合は最初から格納しなおす（行儀はよくないが内部連携のため許容する）
           * 　※リトライによって同一のデータを格納した場合はHTTP409Conflictとなるが正常として扱う
           */
          try {
            saveToVdl(formattedTargetDateTime);
          } catch (Exception e) {
            String msg =
                MessageFormat.format("VDLに格納失敗: targetDateTime={0}", formattedTargetDateTime);
            logger.error(msg, e);
            throw new RetryableRuntimeException(e);
          }

          return null;
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
                    "タイムアウトしたためVDLに格納失敗: targetDateTime={0}", formattedTargetDateTime);
            throw new RuntimeException(msg);
          } else {
            // 原因に関係なくリトライしているため到達不可能である
            String msg =
                MessageFormat.format(
                    "リトライ不可能なエラーが発生したためVDLに格納失敗: targetDateTime={0}", formattedTargetDateTime);
            throw new RuntimeException(msg, recoveryContext.getLastThrowable());
          }
        });
  }

  void saveToVdl(String formattedTargetDateTime) {
    // レスポンスファイルリストを取得
    List<File> fileList = getResponseFileList(formattedTargetDateTime);

    for (File file : fileList) {
      // VDLに格納
      vdlApiClient.post(
          Paths.get(formattedTargetDateTime, file.getName()).toString(), file.toPath());
    }
  }

  List<File> getResponseFileList(String formattedTargetDateTime) {
    // NOTE:
    // 車両情報は1回のリクエストで全件取得可能なため1ファイルのみとなる。
    // もし複数リクエストが必要になる場合は物標情報を参考に修正すること。

    // 対象のディレクトリ
    String baseDir = digitalZensoApiConfig.vehicles().response().save().directory();
    Path saveDirPath = Paths.get(baseDir, formattedTargetDateTime);
    File saveDir = saveDirPath.toFile();
    // 対象のディレクトリ存在チェック
    if (!saveDir.exists() || !saveDir.isDirectory()) {
      throw new RuntimeException("対象のディレクトリが存在しない: " + saveDirPath);
    }
    // 対象日時のファイルを取得
    String fileName = MessageFormat.format("vehicles_{0}.json", formattedTargetDateTime);
    File targetFile = Paths.get(baseDir, formattedTargetDateTime, fileName).toFile();

    // 対象日時のファイルが存在しない場合はWARNログを出力
    if (!targetFile.exists()) {
      logger.warn("レスポンスファイルが不足 : {}", targetFile);
      return Collections.emptyList();
    }

    List<File> targetFileList = new ArrayList<>();
    targetFileList.add(targetFile);

    return targetFileList;
  }
}
