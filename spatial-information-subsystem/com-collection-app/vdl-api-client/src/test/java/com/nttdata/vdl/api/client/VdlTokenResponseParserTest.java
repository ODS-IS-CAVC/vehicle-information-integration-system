package com.nttdata.vdl.api.client;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class VdlTokenResponseParserTest {
  String json =
      """
      {
        "access_token": "test1",
        "id_token": "test2"
      }
      """;

  String jsonEmpty = "{}";

  @Test
  void constructor() {
    try {
      new VdlTokenResponseParser(json);
    } catch (RuntimeException e) {
      Assertions.fail();
    }
  }

  @Test
  void constructor_NG() {
    assertThrows(RuntimeException.class, () -> new VdlTokenResponseParser("invalid json"));
  }

  @Test
  void getResponseBody() {
    VdlTokenResponseParser parser = new VdlTokenResponseParser(json);
    assertEquals(json, parser.getResponseBody());
  }

  @Test
  void getAccessToken() {
    VdlTokenResponseParser parser = new VdlTokenResponseParser(json);
    assertEquals("test1", parser.getAccessToken());
  }

  @Test
  void getAccessToken_NG() {
    VdlTokenResponseParser parser = new VdlTokenResponseParser(jsonEmpty);
    assertThrows(IllegalStateException.class, parser::getAccessToken);
  }

  @Test
  void getIdToken() {
    VdlTokenResponseParser parser = new VdlTokenResponseParser(json);
    assertEquals("test2", parser.getIdToken());
  }

  @Test
  void getIdToken_NG() {
    VdlTokenResponseParser parser = new VdlTokenResponseParser(jsonEmpty);
    assertThrows(IllegalStateException.class, parser::getIdToken);
  }
}
