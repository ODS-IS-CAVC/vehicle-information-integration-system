package com.nttdata.vehicleinfo.collection.spatialindexcreator;

import java.text.MessageFormat;

/**
 * 空間ID
 *
 * <p>ズームレベルおよび位置情報（高度、経度、緯度）に基づいて空間IDを生成する。
 *
 * <p>ズームレベル、高度、経度、緯度の制約事項は<a
 * href="https://github.com/ouranos-gex/ouranos-gex-lib-for-Python">ウラノスGEX 4次元時空間情報基盤用
 * 共通ライブラリ(Python版)</a>と合わせる方針とする。
 *
 * <p>バージョンはコミットハッシュ<a
 * href="https://github.com/ouranos-gex/ouranos-gex-lib-for-Python/tree/8c31c48eccb3b5816432985618071b0ba7cb0a0d">8c31c48</a>を参照する。
 *
 * @param zoomLevel ズームレベル
 * @param altitude 高度
 * @param longitude 経度
 * @param latitude 緯度
 */
public record SpatialId(
    ZoomLevel zoomLevel, Altitude altitude, Longitude longitude, Latitude latitude) {

  /**
   * 指定されたズームレベルおよび位置情報（高度、経度、緯度）に基づいて空間IDを生成する。
   *
   * @param zoomLevel ズームレベル
   * @param altitude 高度
   * @param longitude 経度
   * @param latitude 緯度
   */
  public SpatialId(int zoomLevel, double altitude, double longitude, double latitude) {
    this(
        new ZoomLevel(zoomLevel),
        new Altitude(altitude),
        new Longitude(longitude),
        new Latitude(latitude));
  }

  /**
   * 空間IDの高度(f)インデックスを返す。
   *
   * @return 高度(f)インデックス
   */
  public long f() {
    return calculateF(zoomLevel.value(), altitude.value());
  }

  /**
   * 空間IDの経度(x)インデックスを返す。
   *
   * @return 経度(x)インデックス
   */
  public long x() {
    return calculateX(zoomLevel.value(), longitude.value());
  }

  /**
   * 空間IDの緯度(y)インデックスを返す。
   *
   * @return 緯度(y)インデックス
   */
  public long y() {
    return calculateY(zoomLevel.value(), latitude.value());
  }

  /**
   * ZFXY(ズームレベル(z)/高度(f)インデックス/経度(x)インデックス/緯度(y)インデックス)形式の空間IDを返す。
   *
   * <p>例) 26/0/0/0
   *
   * @return ZFXY(ズームレベル(z)/高度(f)インデックス/経度(x)インデックス/緯度(y)インデックス)形式の空間ID
   */
  public String formatToZfxy() {
    return MessageFormat.format(
        "{0}/{1}/{2}/{3}",
        String.valueOf(zoomLevel.value()),
        String.valueOf(f()),
        String.valueOf(x()),
        String.valueOf(y()));
  }

  /**
   * 空間IDの高度(f)インデックスを算出する。
   *
   * @param zoomLevel ズームレベル
   * @param altitude 高度
   * @return 高度(f)インデックス
   */
  static long calculateF(int zoomLevel, double altitude) {
    long n = 1L << zoomLevel;
    long H = 1 << 25;
    return (long) Math.floor(n * (altitude / H));
  }

  /**
   * 空間IDの経度(x)インデックスを算出する。
   *
   * @param zoomLevel ズームレベル
   * @param longitude 経度
   * @return 経度(x)インデックス
   */
  static long calculateX(int zoomLevel, double longitude) {
    // 180を補正
    // NOTE: ロジックは以下の実装を参考にする
    // https://github.com/ouranos-gex/ouranos-gex-lib-for-Python/blob/main/src/SpatialId/shape/point.py#L290-L292
    if (longitude == 180.0) {
      longitude = -180.0;
    }
    long n = 1L << zoomLevel;
    return (long) Math.floor(n * ((longitude + 180.0) / 360.0));
  }

  /**
   * 空間IDの緯度(y)インデックスを算出する。
   *
   * @param zoomLevel ズームレベル
   * @param latitude 緯度
   * @return 緯度(y)インデックス
   */
  static long calculateY(int zoomLevel, double latitude) {
    double latitudeRadian = Math.toRadians(latitude);
    long n = 1L << zoomLevel;
    return (long)
        Math.floor(
            n
                * (1
                    - Math.log(Math.tan(latitudeRadian) + (1 / Math.cos(latitudeRadian))) / Math.PI)
                / 2);
  }

  /**
   * 空間IDのズームレベル
   *
   * <p>詳細は以下の通り。
   *
   * <blockquote>
   *
   * <p>指定可能な精度の範囲は、0から35とする。（精度26で水平方向はおよそ0.6m、垂直方向は0.5m程度の分解能）
   *
   * <p><a
   * href="https://github.com/ouranos-gex/ouranos-gex-lib-for-Python/blob/8c31c48eccb3b5816432985618071b0ba7cb0a0d/docs/design/point.md#%E5%88%B6%E7%B4%84%E4%BA%8B%E9%A0%85">制約事項</a>
   *
   * </blockquote>
   *
   * @param value ズームレベル
   */
  public record ZoomLevel(int value) {

    /** 指定されたズームレベルが正しい場合のみ生成する。 */
    public ZoomLevel {
      // 範囲チェック
      if (value < 0 || value > 35) {
        throw new IllegalArgumentException("ズームレベルは0から35");
      }
    }
  }

  /**
   * 空間IDの高度
   *
   * <p>高度に関する制約はない。
   *
   * <p><a
   * href="https://github.com/ouranos-gex/ouranos-gex-lib-for-Python/blob/8c31c48eccb3b5816432985618071b0ba7cb0a0d/docs/design/point.md#%E5%88%B6%E7%B4%84%E4%BA%8B%E9%A0%85">制約事項</a>
   *
   * @param value 高度
   */
  public record Altitude(double value) {}

  /**
   * 空間IDの経度
   *
   * <p>詳細は以下の通り。
   *
   * <blockquote>
   *
   * <p>>経度の限界値は±180であるが、180と-180は同じ個所を指すこととZFXY形式のインデックスの考え方により、180はライブラリ内部では-180として扱う。(180の入力は可能とする。)
   *
   * <p><a
   * href="https://github.com/ouranos-gex/ouranos-gex-lib-for-Python/blob/8c31c48eccb3b5816432985618071b0ba7cb0a0d/docs/design/point.md#%E5%88%B6%E7%B4%84%E4%BA%8B%E9%A0%85">制約事項</a>
   *
   * </blockquote>
   *
   * @param value 経度
   */
  public record Longitude(double value) {

    /** 指定された経度が正しい場合のみ生成する。 */
    public Longitude {
      // 範囲チェック
      if (Math.abs(value) > 180.0) {
        throw new IllegalArgumentException("経度は-180から180");
      }
    }
  }

  /**
   * 空間IDの緯度
   *
   * <p>詳細は以下の通り。
   *
   * <blockquote>
   *
   * <p>>緯度の限界値はZFXY形式で使用されるWebメルカトルに合わせ、緯度は±85.0511287798の範囲内とする。
   *
   * <p>>緯度は小数点以下の有効数字を10桁とする。11桁以降は切り捨てるものとする。
   *
   * <p><a
   * href="https://github.com/ouranos-gex/ouranos-gex-lib-for-Python/blob/8c31c48eccb3b5816432985618071b0ba7cb0a0d/docs/design/point.md#%E5%88%B6%E7%B4%84%E4%BA%8B%E9%A0%85">制約事項</a>
   *
   * </blockquote>
   *
   * @param value 緯度
   */
  public record Latitude(double value) {

    /** 指定された緯度が正しい場合のみ生成する。 */
    public Latitude {
      // 緯度の小数点以下の有効数字を10桁（11桁以降は切り捨て）とする
      // NOTE: ロジックは以下の実装を参考にする
      // https://github.com/ouranos-gex/ouranos-gex-lib-for-Python/blob/main/src/SpatialId/common/object/point.py#L43-L51
      if (value >= 0) {
        value = Math.floor(value * Math.pow(10, 10)) / Math.pow(10, 10);
      } else {
        value = Math.ceil(value * Math.pow(10, 10)) / Math.pow(10, 10);
      }
      // 範囲チェック
      if (Math.abs(value) > 85.0511287798) {
        throw new IllegalArgumentException("緯度は-85.0511287798から85.0511287798");
      }
    }
  }
}
