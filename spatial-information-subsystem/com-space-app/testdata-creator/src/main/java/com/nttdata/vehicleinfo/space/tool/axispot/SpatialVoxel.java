package com.nttdata.vehicleinfo.space.tool.axispot;

/**
 * 空間ボクセル
 *
 * <p>ズームレベルおよび空間ボクセルを表す経度の最大/最小値、緯度の最大/最小値、高度の最大/最小値を保持する.
 *
 * @param maxLongitude 経度(最大)
 * @param minLongitude 経度(最小)
 * @param maxLatitude 緯度(最大)
 * @param minLatitude 緯度(最小)
 * @param maxAltitude 高度(最大)
 * @param minAltitude 高度(最小)
 */
public record SpatialVoxel(
    double maxLongitude,
    double minLongitude,
    double maxLatitude,
    double minLatitude,
    double maxAltitude,
    double minAltitude) {

  private static final String SEPARATOR = "/";
  private static final int SIGNIFICANT_DIGITS = 10;

  /**
   * ZFXY形式の空間IDから空間ボクセルを算出する.
   *
   * <p>空間IDに含まれるインデックス値から位置情報(経度、緯度、高度)を算出する方法は、 {@code
   * com.nttdata.vehicleinfo.collection.spatialindexcreator.SpatialId}の実装の逆算により算出するものとする.
   *
   * @param spatialId ZFXY形式の空間ID
   * @return 空間ボクセル
   */
  public static SpatialVoxel parse(String spatialId) {
    String[] split = spatialId.split(SEPARATOR);
    if (split.length != 4) {
      throw new IllegalArgumentException("Invalid spatial id: " + spatialId);
    }
    return parse(
        Integer.parseInt(split[0]),
        Long.parseLong(split[1]),
        Long.parseLong(split[2]),
        Long.parseLong(split[3]));
  }

  private static SpatialVoxel parse(int zoomLevel, long altIdx, long lonIdx, long latIdx) {
    // idxは切り捨てにより算出されているため、idxから逆算された値はボクセルの端に該当する
    // 経度はidxが増加するごとに-180から180に移動する
    // 次のidxの小数点以下の有効数字10桁目をデクリメントした値を現在のidxの最大値とする
    double maxLongitude = backwardX(zoomLevel, lonIdx + 1) - 1 / Math.pow(10, SIGNIFICANT_DIGITS);
    double minLongitude = backwardX(zoomLevel, lonIdx);
    // 緯度はidxが増加するごとに85.0511287798から-85.0511287798に移動する
    double maxLatitude = backwardY(zoomLevel, latIdx);
    // 次のidxの小数点以下の有効数字10桁目をインクリメントした値を現在のidxの最低値とする
    double minLatitude = backwardY(zoomLevel, latIdx + 1) + 1 / Math.pow(10, SIGNIFICANT_DIGITS);
    // テストデータでは高度は常に0とする
    double maxAltitude = 0;
    double minAltitude = 0;
    return new SpatialVoxel(
        maxLongitude, minLongitude,
        maxLatitude, minLatitude,
        maxAltitude, minAltitude);
  }

  /**
   * 経度インデックスの算出方法の逆算により経度インデックスから経度を算出する.
   *
   * @see com.nttdata.vehicleinfo.collection.spatialindexcreator.SpatialId#calculateX(int, double)
   * @param zoomLevel ズームレベル
   * @param idx 経度インデックス
   * @return 経度
   */
  private static double backwardX(int zoomLevel, long idx) {
    long n = 1L << zoomLevel;
    // com.nttdata.vehicleinfo.collection.spatialindexcreator.SpatialId#calculateXに実装されている計算式を
    // longitude = yの形に整形する
    return ((idx / (double) n) * 360.0) - 180.0;
  }

  /**
   * 緯度インデックスの算出方法の逆算により緯度インデックスから緯度を算出する.
   *
   * @see com.nttdata.vehicleinfo.collection.spatialindexcreator.SpatialId#calculateY(int, double)
   * @param zoomLevel ズームレベル
   * @param idx 緯度インデックス
   * @return 緯度
   */
  private static double backwardY(int zoomLevel, long idx) {
    long n = 1L << zoomLevel;
    // com.nttdata.vehicleinfo.collection.spatialindexcreator.SpatialId#calculateYに実装されている計算式を
    // tan(x) + 1/cos(x) = yの形に整形する
    double y = Math.exp((1 - (2 * idx) / (double) n) * Math.PI);
    // sec(x)^2 - tan(x)^2 = 1より、2sec(x) = y + 1/y
    // sec(x) = (y^2 + 1)/2y
    // cos(x) = 2y(y^2 + 1)
    return Math.toDegrees(Math.acos(2 * y / (Math.pow(y, 2) + 1)));
  }
}
