package com.nttdata.vehicleinfo.space.tool.axispot;

import static org.assertj.core.api.Assertions.assertThat;

import com.nttdata.vehicleinfo.collection.spatialindexcreator.SpatialId;
import org.junit.jupiter.api.Test;

public class SpatialVoxelTest {

  @Test
  public void parse() {
    String spatialId = "15/0/29183/12809";
    SpatialVoxel voxel = SpatialVoxel.parse(spatialId);

    // 各頂点の空間IDが一致すること
    SpatialId topLeft =
        new SpatialId(15, voxel.maxAltitude(), voxel.minLongitude(), voxel.maxLatitude());
    SpatialId topRight =
        new SpatialId(15, voxel.maxAltitude(), voxel.maxLongitude(), voxel.maxLatitude());
    SpatialId bottomLeft =
        new SpatialId(15, voxel.maxAltitude(), voxel.minLongitude(), voxel.minLatitude());
    SpatialId bottomRight =
        new SpatialId(15, voxel.maxAltitude(), voxel.maxLongitude(), voxel.minLatitude());
    assertThat(topLeft.formatToZfxy()).isEqualTo(spatialId);
    assertThat(topRight.formatToZfxy()).isEqualTo(spatialId);
    assertThat(bottomLeft.formatToZfxy()).isEqualTo(spatialId);
    assertThat(bottomRight.formatToZfxy()).isEqualTo(spatialId);
  }
}
