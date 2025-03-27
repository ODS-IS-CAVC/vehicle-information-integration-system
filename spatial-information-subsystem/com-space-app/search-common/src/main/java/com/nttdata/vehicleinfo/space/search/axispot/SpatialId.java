package com.nttdata.vehicleinfo.space.search.axispot;

/**
 * 空間IDオブジェクト
 *
 * @param zoom ズームレベル
 * @param altitude 高度インデックス
 * @param longitude 経度インデックス
 * @param latitude 緯度インデックス
 */
public record SpatialId(int zoom, int altitude, int longitude, int latitude) {

  /** {@code /}で結合された空間IDが返却されます。 */
  public String toString() {
    return zoom + "/" + altitude + "/" + longitude + "/" + latitude;
  }

  /**
   * 空間ID({@code "zoom/altitude/longitude/latitude"})の文字列から空間IDオブジェクトを返却します.
   *
   * @param spatialId 空間IDの文字列
   * @return 空間IDオブジェクト
   */
  public static SpatialId parse(String spatialId) {
    String[] split = spatialId.split("/");
    return new SpatialId(
        Integer.parseInt(split[0]),
        Integer.parseInt(split[1]),
        Integer.parseInt(split[2]),
        Integer.parseInt(split[3]));
  }
}
