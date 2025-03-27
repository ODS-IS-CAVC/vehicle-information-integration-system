package com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.test;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.net.URISyntaxException;
import java.util.Properties;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import redis.clients.jedis.Connection;
import redis.clients.jedis.ConnectionPoolConfig;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisCluster;

public class AxispotClientTestHelper {

  public static GenericContainer<?> getContainer() {
    return new GenericContainer<>("bitnami/redis-cluster:7.0.15")
        .withEnv("ALLOW_EMPTY_PASSWORD", "yes")
        .withEnv("REDIS_CLUSTER_REPLICAS", "0")
        .withEnv("REDIS_NODES", "127.0.0.1 127.0.0.1 127.0.0.1")
        .withEnv("REDIS_CLUSTER_CREATOR", "yes")
        .withExposedPorts(6379)
        .waitingFor(Wait.forLogMessage(".*Cluster state changed: ok\\n", 1));
  }

  public static String getGeotempConfig() {
    try {
      return new File(
              MethodHandles.lookup()
                  .lookupClass()
                  .getClassLoader()
                  .getResource("axispot/geotempConfig.properties")
                  .toURI())
          .toString();
    } catch (URISyntaxException e) {
      throw new RuntimeException(e);
    }
  }

  public static void updateGeotempConfig(String comment, String storeNodeInfo) {
    String geotempConfig = getGeotempConfig();
    try (FileInputStream input = new FileInputStream(geotempConfig)) {
      Properties properties = new Properties();
      properties.load(input);
      // geotempConifg.propertiesを上書き
      properties.setProperty("storeNodeInfo", storeNodeInfo);
      try (FileOutputStream output = new FileOutputStream(geotempConfig)) {
        properties.store(output, comment);
      }
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public static void flushDB(HostAndPort hostAndPort, int timeout) {
    try (JedisCluster cluster =
        new JedisCluster(hostAndPort, timeout, new ConnectionPoolConfig())) {
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
}
