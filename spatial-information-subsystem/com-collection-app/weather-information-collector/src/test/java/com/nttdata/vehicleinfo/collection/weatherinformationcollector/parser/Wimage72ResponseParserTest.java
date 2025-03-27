package com.nttdata.vehicleinfo.collection.weatherinformationcollector.parser;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class Wimage72ResponseParserTest {
  @Test
  void constructor_NG() {
    assertThrows(RuntimeException.class, () -> new Wimage72ResponseParser("invalid json"));
  }

  @Test
  void parseVersion_failed() {
    // 準備
    Wimage72ResponseParser parser = new Wimage72ResponseParser("{\"ForecastPrecipitaiton\":[]}");
    // 実行と検証
    // バージョンが取得できない場合は"UNKNOWN"であること
    assertEquals("UNKNOWN", parser.parseVersion());
  }
}
