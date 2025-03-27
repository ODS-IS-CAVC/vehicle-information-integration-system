package com.nttdata.vehicleinfo.collection.targetinformationcollector.parser;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class TargetInfoResponseParserTest {

  @Test
  void constructor() {
    // NG
    assertThrows(
        RuntimeException.class,
        () -> {
          new TargetInfoResponseParser("invalid");
        });
  }

  @Test
  void getResponseBody() {
    TargetInfoResponseParser parser = new TargetInfoResponseParser("{\"test\":\"test\"}");
    assertEquals("{\"test\":\"test\"}", parser.getResponseBody());
  }
}
