package com.nttdata.vehicleinfo.space.tool.runner;

import com.nttdata.vehicleinfo.space.tool.config.AxispotConfig;
import com.nttdata.vehicleinfo.space.tool.config.TestDataConfig;
import com.nttdata.vehicleinfo.space.tool.util.RandomDataCreator;
import java.sql.Timestamp;
import java.util.List;
import java.util.Objects;
import jp.co.ntt.sic.Geotemp;
import jp.co.ntt.sic.MovingObjectKey;
import jp.co.ntt.sic.MovingObjectRawData;
import jp.co.ntt.sic.MovingObjectValue;
import org.locationtech.jts.geom.Coordinate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisCluster;

/** テストデータを生成するRunnerクラス. */
@Component
public class TestDataCreateRunner implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(TestDataCreateRunner.class);

  private final Geotemp geotemp;
  private final AxispotConfig axispotConfig;
  private final TestDataConfig testDataConfig;

  public TestDataCreateRunner(
      Geotemp geotemp, AxispotConfig axispotConfig, TestDataConfig testDataConfig) {
    this.geotemp = geotemp;
    this.axispotConfig = axispotConfig;
    this.testDataConfig = testDataConfig;
  }

  @Override
  public void run(ApplicationArguments args) throws Exception {
    if (testDataConfig.isFlushData()) {
      // テストデータ格納前にRedisクラスター上のでデータを削除する
      // TODO ElastiCacheに対して実行しようとするとエラーになる
      log.info("Flush data");
      String[] storeNodeInfo = axispotConfig.storeNodeInfo().split(":");
      HostAndPort hostAndPort =
          new HostAndPort(storeNodeInfo[0], Integer.parseInt(storeNodeInfo[1]));
      try (JedisCluster jedis = new JedisCluster(hostAndPort)) {
        jedis.flushAll();
      }
    }

    // staticなテストデータの格納
    if (Objects.nonNull(testDataConfig.getData()) && !testDataConfig.getData().isEmpty()) {
      log.info("start to create static data.");
      for (TestDataConfig.Data data : testDataConfig.getData()) {
        MovingObjectRawData staticData = createStaticData(data);
        log.info("set static data into axispot: key={}", staticData.getKey());
        geotemp.set(staticData);
      }
      log.info("end static data create.");
    }

    // ランダムなテストデータの格納
    if (Objects.nonNull(testDataConfig.getRandomData())
        && !testDataConfig.getRandomData().isEmpty()) {
      log.info("start to create random data.");
      for (TestDataConfig.RandomData randomConfig : testDataConfig.getRandomData()) {

        // データ生成器の作成
        RandomDataCreator creator = new RandomDataCreator(randomConfig);

        List<MovingObjectRawData> randomDataList =
            creator.create(
                testDataConfig.getRandomDataBaseTime(),
                testDataConfig.getRandomDataDuration(),
                testDataConfig.getRandomDataOutputDir());
        // 生成したデータをAxispotに格納する
        for (MovingObjectRawData randomData : randomDataList) {
          log.debug(
              "set random data into axispot: key={}, value={}",
              randomData.getKey(),
              randomData.getValue());
          geotemp.set(randomData);
        }
        log.info(
            "set random data into axispot: name=\"{}\", type=\"{}\", count=\"{}\", from=\"{}\", duration=\"{}\"",
            randomConfig.name(),
            randomConfig.templateType(),
            randomDataList.size(),
            Objects.nonNull(randomConfig.baseTime())
                ? randomConfig.baseTime()
                : testDataConfig.getRandomDataBaseTime(),
            Objects.nonNull(randomConfig.duration())
                ? randomConfig.duration()
                : testDataConfig.getRandomDataDuration());
      }
    }
    log.info("end random data create.");
  }

  private MovingObjectRawData createStaticData(TestDataConfig.Data data) {
    MovingObjectKey key =
        new MovingObjectKey(
            data.key().time().toEpochSecond(),
            data.key().longitude(),
            data.key().latitude(),
            data.key().altitude(),
            data.key().movingObjectId());
    MovingObjectValue value =
        new MovingObjectValue(
            new Coordinate(data.key().longitude(), data.key().latitude(), data.key().altitude()),
            Timestamp.from(data.key().time().toInstant()),
            data.attributes());
    return new MovingObjectRawData(key, value);
  }
}
