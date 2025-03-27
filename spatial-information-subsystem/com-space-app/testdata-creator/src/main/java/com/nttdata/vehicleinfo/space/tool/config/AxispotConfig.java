package com.nttdata.vehicleinfo.space.tool.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Axispotへの接続情報を保持するためのConfigurationクラス. application.yamlの{@code axispot}に対応する. */
@ConfigurationProperties("axispot")
public record AxispotConfig(String storeNodeInfo, String bitPattern, int cacheTtl) {}
