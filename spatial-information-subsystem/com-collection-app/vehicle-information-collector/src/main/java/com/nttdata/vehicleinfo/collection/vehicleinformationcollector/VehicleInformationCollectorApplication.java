package com.nttdata.vehicleinfo.collection.vehicleinformationcollector;

import java.lang.invoke.MethodHandles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/** 車両情報収集AP */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class VehicleInformationCollectorApplication {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  /**
   * 車両情報収集APのエントリーポイント。
   *
   * <p>SpringApplicationを起動する。
   *
   * <p>コマンドライン引数をSpringApplicationのアプリケーション引数として設定する。
   *
   * @param args コマンドライン引数
   */
  public static void main(String[] args) {
    logger.debug("main");
    SpringApplication.run(VehicleInformationCollectorApplication.class, args);
  }
}
