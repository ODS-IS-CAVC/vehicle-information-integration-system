package com.nttdata.vehicleinfo.space.search;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;

@TestConfiguration(proxyBeanMethods = false)
public class ContainerConfig {

  @Bean
  public GenericContainer<?> axispotRedis(DynamicPropertyRegistry registry) {
    GenericContainer<?> container =
        new GenericContainer<>("bitnami/redis-cluster:7.0.15")
            .withEnv("ALLOW_EMPTY_PASSWORD", "yes")
            .withEnv("REDIS_CLUSTER_REPLICAS", "0")
            .withEnv("REDIS_NODES", "127.0.0.1 127.0.0.1 127.0.0.1")
            .withEnv("REDIS_CLUSTER_CREATOR", "yes")
            .withExposedPorts(6379)
            .waitingFor(Wait.forLogMessage(".*Cluster state changed: ok\\n", 1));
    registry.add(
        "axispot.storeNodeInfo", () -> container.getHost() + ":" + container.getMappedPort(6379));
    return container;
  }
}
