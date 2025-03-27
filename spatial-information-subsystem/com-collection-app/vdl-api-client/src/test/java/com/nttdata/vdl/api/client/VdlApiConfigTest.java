package com.nttdata.vdl.api.client;

import static com.nttdata.vdl.api.client.test.DynamicPropertySourceTestHelper.Keys.VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET;
import static com.nttdata.vdl.api.client.test.DynamicPropertySourceTestHelper.Keys.VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD;
import static org.junit.jupiter.api.Assertions.*;

import com.nttdata.vdl.api.client.test.TestVdlApiConfig;
import jakarta.annotation.PostConstruct;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(classes = TestVdlApiConfig.class)
@EnableConfigurationProperties(TestVdlApiConfig.class)
class VdlApiConfigTest {

  @Autowired private TestVdlApiConfig testVdlApiConfig;
  private VdlApiConfig vdlApiConfig;

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) {
    // 環境変数の設定が必須のプロパティを設定
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET, () -> "TEST");
    registry.add(VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD, () -> "TEST");
  }

  @PostConstruct
  void init() {
    vdlApiConfig = testVdlApiConfig.getApi();
  }

  @Test
  void vdlApiConfig() {
    // VdlApiConfigが取得できていること
    assertNotNull(vdlApiConfig);

    // Tokenの設定値（resources/application.yaml）が取得できること
    assertEquals(
        "https://localhost:31444/realms/vdl/protocol/openid-connect/token",
        vdlApiConfig.token().request().endpoint());
    assertEquals("vdl_client", vdlApiConfig.token().request().parameters().clientId());
    assertEquals("TEST", vdlApiConfig.token().request().parameters().clientSecret());
    assertEquals("test-admin", vdlApiConfig.token().request().parameters().username());
    assertEquals("TEST", vdlApiConfig.token().request().parameters().password());
    assertEquals("password", vdlApiConfig.token().request().parameters().grantType());
    assertEquals("openid", vdlApiConfig.token().request().parameters().scope());
    assertEquals(10000, vdlApiConfig.token().request().timeout());
    assertFalse(vdlApiConfig.token().request().verifySsl());

    // Dataの設定値（resources/application.yaml）が取得できること
    assertEquals("https://localhost:30090/api/v1/data", vdlApiConfig.data().request().endpoint());
    assertEquals("/vdl-path-prefix/test", vdlApiConfig.data().request().vdlPathPrefix());
    assertEquals(10000, vdlApiConfig.data().request().timeout());
    assertFalse(vdlApiConfig.data().request().verifySsl());
    assertEquals(3100, vdlApiConfig.data().request().retry().timeout());
    assertEquals(1000, vdlApiConfig.data().request().retry().fixedBackoff());
  }
}
