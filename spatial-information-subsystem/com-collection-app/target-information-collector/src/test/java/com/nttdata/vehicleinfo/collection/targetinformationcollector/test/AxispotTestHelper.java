package com.nttdata.vehicleinfo.collection.targetinformationcollector.test;

import com.google.protobuf.InvalidProtocolBufferException;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.target.axispot.AxispotClient;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Stream;
import jp.co.ntt.sic.MovingObjectStoreData;
import jp.co.ntt.sic.config.GeotempConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.Connection;
import redis.clients.jedis.ConnectionPoolConfig;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisCluster;

public class AxispotTestHelper implements AutoCloseable {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private AxispotClient axispotClient;
  private GeotempConfig geotempConfig;
  private HostAndPort hostAndPort;
  private final int TIMEOUT = 1000;

  public AxispotTestHelper(Path geotempConfigPath) {
    this.axispotClient = new AxispotClient(geotempConfigPath);
    try {
      this.geotempConfig = new GeotempConfig(geotempConfigPath);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
    this.hostAndPort = HostAndPort.from(this.geotempConfig.getStoreNodeInfo());
  }

  public int count(
      long time, double longitude, double latitude, double altitude, int searchPrecision) {
    Set<MovingObjectStoreData> result =
        axispotClient.search(time, longitude, latitude, altitude, searchPrecision);
    logger.debug("result = {}", result);
    return result.size();
  }

  public void flushDB() {
    try (JedisCluster cluster =
        new JedisCluster(hostAndPort, TIMEOUT, new ConnectionPoolConfig())) {
      cluster
          .getClusterNodes()
          .values()
          .forEach(
              connectionPool -> {
                try (Connection conn = connectionPool.getResource()) {
                  try (Jedis jedis = new Jedis(conn)) {
                    if (jedis.info("replication").contains("role:master")) {
                      jedis.flushDB();
                    }
                  }
                }
              });
    }
  }

  /**
   * 全ノードからすべてのキーを取得する.<br>
   * 全ノードに「KEYS *」を実行する.
   *
   * @return すべてのキー
   */
  public String[] keysAll() {
    try (JedisCluster cluster =
        new JedisCluster(hostAndPort, TIMEOUT, new ConnectionPoolConfig())) {
      return cluster.getClusterNodes().values().stream()
          .flatMap(
              connectionPool -> {
                try (Jedis jedis = new Jedis(connectionPool.getResource())) {
                  if (jedis.info("replication").contains("role:master")) {
                    return jedis.keys("*").stream();
                  } else {
                    return Stream.empty();
                  }
                }
              })
          .toArray(String[]::new);
    }
  }

  /**
   * Redisクラスタからすべての移動体データを取得する.
   *
   * @return 移動体データのSet
   */
  public Set<MovingObjectStoreData> getAll() {
    Set<MovingObjectStoreData> result = new HashSet<>();
    // 全キーを取得
    String[] keys = keysAll();
    // keyのmemberをすべて取得
    try (JedisCluster cluster =
        new JedisCluster(hostAndPort, TIMEOUT, new ConnectionPoolConfig())) {
      for (String key : keys) {
        // > ZRANGEBYSCORE key -inf +inf
        cluster
            .zrangeByScore(
                key.getBytes(StandardCharsets.UTF_8),
                "-inf".getBytes(StandardCharsets.UTF_8),
                "+inf".getBytes(StandardCharsets.UTF_8))
            .forEach(
                member -> {
                  try {
                    // MovingObjectStoreDataに変換
                    result.add(MovingObjectStoreData.convertFromBytes(member));
                  } catch (InvalidProtocolBufferException e) {
                    throw new RuntimeException(e);
                  }
                });
      }
    }
    return result;
  }

  @Override
  public void close() {
    axispotClient.close();
  }
}
