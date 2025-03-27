package com.nttdata.vehicleinfo.space.search.axispot;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

public class SpatialIdTest {

  @Test
  public void parse() {
    String str = "15/0/29183/12809";

    // パース実施
    SpatialId spatialId = SpatialId.parse(str);

    // 検証
    assertThat(spatialId.zoom()).isEqualTo(15);
    assertThat(spatialId.longitude()).isEqualTo(29183);
    assertThat(spatialId.latitude()).isEqualTo(12809);
    assertThat(spatialId.altitude()).isEqualTo(0);
    assertThat(spatialId.toString()).isEqualTo(str);
  }
}
