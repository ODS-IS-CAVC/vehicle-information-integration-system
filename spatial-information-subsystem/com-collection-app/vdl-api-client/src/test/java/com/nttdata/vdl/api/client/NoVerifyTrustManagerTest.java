package com.nttdata.vdl.api.client;

import static org.junit.jupiter.api.Assertions.*;

import java.net.Socket;
import javax.net.ssl.SSLEngine;
import org.junit.jupiter.api.Test;

class NoVerifyTrustManagerTest {

  NoVerifyTrustManager trustManager = new NoVerifyTrustManager();

  @Test
  void getAcceptedIssuers() {
    // 空の配列であること
    assertEquals(0, trustManager.getAcceptedIssuers().length);
  }

  @Test
  void checkClientTrusted() {
    // 例外が発生しないこと
    assertDoesNotThrow(() -> trustManager.checkClientTrusted(null, null));
    assertDoesNotThrow(() -> trustManager.checkClientTrusted(null, null, (Socket) null));
    assertDoesNotThrow(() -> trustManager.checkClientTrusted(null, null, (SSLEngine) null));
  }

  @Test
  void checkServerTrusted() {
    // 例外が発生しないこと
    assertDoesNotThrow(() -> trustManager.checkServerTrusted(null, null));
    assertDoesNotThrow(() -> trustManager.checkServerTrusted(null, null, (Socket) null));
    assertDoesNotThrow(() -> trustManager.checkServerTrusted(null, null, (SSLEngine) null));
  }
}
