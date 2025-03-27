package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.parser;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class VehiclesResponseParserTest {

  @Test
  void constructor() {
    // NG
    assertThrows(
        RuntimeException.class,
        () -> {
          new VehiclesResponseParser("invalid");
        });
  }

  @Test
  void getResponseBody() {
    VehiclesResponseParser parser = new VehiclesResponseParser("{\"test\":\"test\"}");
    assertEquals("{\"test\":\"test\"}", parser.getResponseBody());
  }
}
