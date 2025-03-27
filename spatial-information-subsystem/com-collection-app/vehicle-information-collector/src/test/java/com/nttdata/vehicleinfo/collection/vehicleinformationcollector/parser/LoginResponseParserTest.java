package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.parser;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class LoginResponseParserTest {

  @Test
  void constructor() {
    // NG
    assertThrows(
        RuntimeException.class,
        () -> {
          new LoginResponseParser("invalid");
        });
  }

  @Test
  void getResponseBody() {
    LoginResponseParser parser = new LoginResponseParser("{\"test\":\"test\"}");
    assertEquals("{\"test\":\"test\"}", parser.getResponseBody());
  }

  @Test
  void getAccessToken() {
    // OK
    LoginResponseParser parserOk = new LoginResponseParser("{\"accessToken\":\"test\"}");
    assertEquals("test", parserOk.getAccessToken());

    // Nothing
    LoginResponseParser parserNothing = new LoginResponseParser("{\"test\":\"test\"}");
    assertNull(parserNothing.getAccessToken());
  }
}
