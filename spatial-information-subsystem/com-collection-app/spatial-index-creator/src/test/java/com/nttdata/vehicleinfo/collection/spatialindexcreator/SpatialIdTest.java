package com.nttdata.vehicleinfo.collection.spatialindexcreator;

import static org.junit.jupiter.api.Assertions.*;

import java.lang.invoke.MethodHandles;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class SpatialIdTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Nested
  class ZoomLevelTest {
    @Test
    void constructor() {
      // ズームレベルは0～35まで指定可能であること
      assertEquals(0, new SpatialId.ZoomLevel(0).value());
      assertEquals(35, new SpatialId.ZoomLevel(35).value());
      assertThrows(IllegalArgumentException.class, () -> new SpatialId.ZoomLevel(-1));
      assertThrows(IllegalArgumentException.class, () -> new SpatialId.ZoomLevel(36));
    }
  }

  @Nested
  class LongitudeTest {
    @Test
    void constructor() {
      // 経度は+-180.0まで指定可能であること
      assertEquals(180.0, new SpatialId.Longitude(180.0).value(), 0.0);
      assertEquals(-180.0, new SpatialId.Longitude(-180.0).value(), 0.0);
      double maxNext = Math.nextUp(180.0);
      double minNext = Math.nextDown(-180.0);
      logger.info("maxNext: {}", maxNext);
      logger.info("minNext: {}", minNext);
      assertThrows(IllegalArgumentException.class, () -> new SpatialId.Longitude(maxNext));
      assertThrows(IllegalArgumentException.class, () -> new SpatialId.Longitude(minNext));
    }
  }

  @Nested
  class LatitudeTest {
    @Test
    void constructor() {
      // 緯度は+-85.0511287798まで指定可能であること
      assertEquals(85.0511287798, new SpatialId.Latitude(85.0511287798).value(), 0.0);
      assertEquals(-85.0511287798, new SpatialId.Latitude(-85.0511287798).value(), 0.0);
      // latitudeの11桁以降は切り捨てのため10桁目を調整
      double maxNext = 85.0511287799;
      double minNext = -85.0511287799;
      assertThrows(IllegalArgumentException.class, () -> new SpatialId.Latitude(maxNext));
      assertThrows(IllegalArgumentException.class, () -> new SpatialId.Latitude(minNext));
    }
  }

  @Test
  void getSpatialIdZfxy() {
    // それぞれが違う値になる値を設定
    SpatialId z26 = new SpatialId(26, 0, 0, -85.0511287798);
    // 正しいフォーマットであること
    // [ズームレベル]/[高度インデックス]/[経度インデックス]/[緯度インデックス]
    assertEquals("26/0/33554432/67108863", z26.formatToZfxy());
  }

  @Test
  void calculateF() {
    // ズームレベル0（共通ライブラリのズームレベルの最小値）
    /*
    z=0, alt=33554432        ['0/1/0/0']
    z=0, alt=33554431.999999 ['0/0/0/0']
    z=0, alt=0               ['0/0/0/0']
    z=0, alt=-0.000001       ['0/-1/0/0']
    z=0, alt=-33554432       ['0/-1/0/0']
    */
    assertEquals(1, SpatialId.calculateF(0, 33554432)); // 最大インデックスの開始
    assertEquals(0, SpatialId.calculateF(0, 33554431.999999)); // 最大インデックスの開始より下
    assertEquals(0, SpatialId.calculateF(0, 0.0)); // インデックス0の開始
    assertEquals(-1, SpatialId.calculateF(0, -0.000001)); // インデックス0の開始より下
    assertEquals(-1, SpatialId.calculateF(0, -33554432)); // 最小インデックスの開始

    // ズームレベル1（Axispotの扱えるズームレベルの最小値）
    /*
    z=1, alt=33554432         ['1/2/0/0']
    z=1, alt=33554431.999999  ['1/1/0/0']
    z=1, alt=16777216         ['1/1/0/0']
    z=1, alt=16777215.999999  ['1/0/0/0']
    z=1, alt=0                ['1/0/0/0']
    z=1, alt=-0.000001        ['1/-1/0/0']
    z=1, alt=-16777216        ['1/-1/0/0']
    z=1, alt=-16777216.000001 ['1/-2/0/0']
    z=1, alt=-33554432        ['1/-2/0/0']
    */
    assertEquals(2, SpatialId.calculateF(1, 33554432)); // 最大インデックスの開始
    assertEquals(1, SpatialId.calculateF(1, 33554431.999999)); // 最大インデックスの開始より下
    assertEquals(1, SpatialId.calculateF(1, 16777216)); // インデックス1の開始
    assertEquals(0, SpatialId.calculateF(1, 16777215.999999)); // インデックス1の開始より下
    assertEquals(0, SpatialId.calculateF(1, 0.0)); // インデックス0の開始
    assertEquals(-1, SpatialId.calculateF(1, -0.000001)); // インデックス0の開始より下
    assertEquals(-1, SpatialId.calculateF(1, -16777216)); // インデックス-1の開始
    assertEquals(-2, SpatialId.calculateF(1, -16777216.000001)); // インデックス-1の開始より下
    assertEquals(-2, SpatialId.calculateF(1, -33554432)); // 最小インデックスの開始

    // ズームレベル25（高度が1mになる）
    /*
    z=25, alt=33554432         ['25/33554432/0/0']
    z=25, alt=33554431.999999  ['25/33554431/0/0']
    z=25, alt=1.0              ['25/1/0/0']
    z=25, alt=0.999999         ['25/0/0/0']
    z=25, alt=0.0              ['25/0/0/0']
    z=25, alt=-0.000001        ['25/-1/0/0']
    z=25, alt=-1.0             ['25/-1/0/0']
    z=25, alt=-33554431        ['25/-33554431/0/0']
    z=25, alt=-33554431.000001 ['25/-33554432/0/0']
    z=25, alt=-33554432        ['25/-33554432/0/0']
    */
    assertEquals(33554432, SpatialId.calculateF(25, 33554432)); // 最大インデックスの開始
    assertEquals(33554431, SpatialId.calculateF(25, 33554431.999999)); // 最大インデックスの開始より下
    assertEquals(1, SpatialId.calculateF(25, 1.0)); // インデックス1の開始
    assertEquals(0, SpatialId.calculateF(25, 0.999999)); // インデックス1の開始より下
    assertEquals(0, SpatialId.calculateF(25, 0.0)); // インデックス0の開始
    assertEquals(-1, SpatialId.calculateF(25, -0.000001)); // インデックス0の開始より下
    assertEquals(-1, SpatialId.calculateF(25, -1.0)); // インデックス-1の開始
    assertEquals(-33554431, SpatialId.calculateF(25, -33554431)); // インデックス-33554431の開始
    assertEquals(-33554432, SpatialId.calculateF(25, -33554431.000001)); // インデックス-33554431の開始より下
    assertEquals(-33554432, SpatialId.calculateF(25, -33554432)); // 最小インデックスの開始

    // ズームレベル26（IPAガイドラインで紹介されている最大）
    /*
    z=26, alt=33554432         ['26/67108864/0/0']
    z=26, alt=33554431.999999  ['26/67108863/0/0']
    z=26, alt=0.5              ['26/1/0/0']
    z=26, alt=0.499999         ['26/0/0/0']
    z=26, alt=0.0              ['26/0/0/0']
    z=26, alt=-0.000001        ['26/-1/0/0']
    z=26, alt=-0.5             ['26/-1/0/0']
    z=26, alt=-33554431.5      ['26/-67108863/0/0']
    z=26, alt=-33554431.500001 ['26/-67108864/0/0']
    z=26, alt=-33554432        ['26/-67108864/0/0']
    */
    assertEquals(67108864, SpatialId.calculateF(26, 33554432)); // 最大インデックスの開始
    assertEquals(67108863, SpatialId.calculateF(26, 33554431.999999)); // 最大インデックスの開始より下
    assertEquals(1, SpatialId.calculateF(26, 0.5)); // インデックス1の開始
    assertEquals(0, SpatialId.calculateF(26, 0.499999)); // インデックス1の開始より下
    assertEquals(0, SpatialId.calculateF(26, 0.0)); // インデックス0の開始
    assertEquals(-1, SpatialId.calculateF(26, -0.000001)); // インデックス0の開始より下
    assertEquals(-1, SpatialId.calculateF(26, -0.5)); // インデックス-1の開始
    assertEquals(-67108863, SpatialId.calculateF(26, -33554431.5)); // インデックス-67108863の開始
    assertEquals(-67108864, SpatialId.calculateF(26, -33554431.500001)); // インデックス-67108863の開始より下
    assertEquals(-67108864, SpatialId.calculateF(26, -33554432)); // 最小インデックスの開始

    // ズームレベル35（共通ライブラリの最大ズームレベル）
    /*
    z=35, alt=33554432            ['35/34359738368/0/0']
    z=35, alt=33554431.999999     ['35/34359738367/0/0']
    z=35, alt=0.0009765625        ['35/1/0/0']
    z=35, alt=0.0009765624        ['35/0/0/0']
    z=35, alt=0.0                 ['35/0/0/0']
    z=35, alt=-0.0000000001       ['35/-1/0/0']
    z=35, alt=-0.0009765625       ['35/-1/0/0']
    z=35, alt=-33554431.999023438 ['35/-34359738367/0/0']
    z=35, alt=-33554431.999023440 ['35/-34359738368/0/0']
    z=35, alt=-33554432           ['35/-34359738368/0/0']
    */
    assertEquals(34359738368L, SpatialId.calculateF(35, 33554432)); // 最大インデックスの開始
    assertEquals(34359738367L, SpatialId.calculateF(35, 33554431.999999)); // 最大インデックスの開始より下
    assertEquals(1, SpatialId.calculateF(35, 0.0009765625)); // インデックス1の開始
    assertEquals(0, SpatialId.calculateF(35, 0.0009765624)); // インデックス1の開始より下
    assertEquals(0, SpatialId.calculateF(35, 0.0)); // インデックス0の開始
    assertEquals(-1, SpatialId.calculateF(35, -0.0000000001)); // インデックス0の開始より下
    assertEquals(-1, SpatialId.calculateF(35, -0.0009765625)); // インデックス-1の開始
    assertEquals(
        -34359738367L, SpatialId.calculateF(35, -33554431.999023438)); // インデックス-34359738367の開始
    assertEquals(
        -34359738368L, SpatialId.calculateF(35, -33554431.999023440)); // インデックス-34359738367の開始より下
    assertEquals(-34359738368L, SpatialId.calculateF(35, -33554432)); // 最小インデックスの開始
  }

  @Test
  void calculateX() {
    // ズームレベル0（共通ライブラリのズームレベルの最小値）
    /*
    z=0, lon=180        ['0/0/0/0']
    z=0, lon=179.999999 ['0/0/0/0']
    z=0, lon=-180       ['0/0/0/0']
    */
    // 経度はズームレベル0では分割されない
    assertEquals(0, SpatialId.calculateX(0, 180)); // 経度180は-180として扱う
    assertEquals(0, SpatialId.calculateX(0, 179.999999)); // 経度180より西
    assertEquals(0, SpatialId.calculateX(0, -180)); // 最小・最大インデックスの開始

    // ズームレベル1（Axispotの扱えるズームレベルの最小値）
    /*
    z=1, lon=180        ['1/0/0/0']
    z=1, lon=179.999999 ['1/0/1/0']
    z=1, lon=0          ['1/0/1/0']
    z=1, lon=-0.000001  ['1/0/0/0']
    z=1, lon=-180       ['1/0/0/0']
    */
    assertEquals(0, SpatialId.calculateX(1, 180)); // 経度180は-180として扱う
    assertEquals(1, SpatialId.calculateX(1, 179.999999)); // 経度180より西
    assertEquals(1, SpatialId.calculateX(1, 0.0)); // 最大インデックスの開始
    assertEquals(0, SpatialId.calculateX(1, -0.000001)); // インデックス1の開始より西
    assertEquals(0, SpatialId.calculateX(1, -180)); // 最小インデックスの開始

    // ズームレベル26（IPAガイドラインで紹介されている最大）
    /*
    z=26, lon=180                      ['26/0/0/0']
    z=26, lon=179.999999               ['26/0/67108863/0']
    z=26, lon=179.99999463558197       ['26/0/67108863/0']
    z=26, lon=0.000005364418029785156  ['26/0/33554433/0']
    z=26, lon=0.00000536441801         ['26/0/33554432/0']
    z=26, lon=0                        ['26/0/33554432/0']
    z=26, lon=-0.000001                ['26/0/33554431/0']
    z=26, lon=-0.000005364418029785156 ['26/0/33554431/0']
    z=26, lon=-179.99999463558197      ['26/0/1/0']
    z=26, lon=-179.99999463558199      ['26/0/0/0']
    z=26, lon=-180                     ['26/0/0/0']
    */
    assertEquals(0, SpatialId.calculateX(26, 180)); // 経度180は-180として扱う
    assertEquals(67108863, SpatialId.calculateX(26, 179.999999)); // 経度180より西
    assertEquals(67108863, SpatialId.calculateX(26, 179.99999463558197)); // 最大インデックスの開始
    assertEquals(33554433, SpatialId.calculateX(26, 0.000005364418029785156)); // インデックス33554433の開始
    assertEquals(33554432, SpatialId.calculateX(26, 0.00000536441801)); // インデックス33554433の開始より西
    assertEquals(33554432, SpatialId.calculateX(26, 0.0)); // インデックス33554432の開始
    assertEquals(33554431, SpatialId.calculateX(26, -0.000001)); // インデックス33554432の開始より西
    assertEquals(33554431, SpatialId.calculateX(26, -0.000005364418029785156)); // インデックス33554431の開始
    assertEquals(1, SpatialId.calculateX(26, -179.99999463558197)); // インデックス1の開始
    assertEquals(0, SpatialId.calculateX(26, -179.99999463558199)); // インデックス1の開始より西
    assertEquals(0, SpatialId.calculateX(26, -180)); // 最小インデックスの開始

    // ズームレベル35（共通ライブラリの最大ズームレベル）
    /*
    z=35, lon=180                         ['35/0/0/0']
    z=35, lon=179.9999999999999           ['35/0/34359738367/0']
    z=35, lon=179.99999998952262          ['35/0/34359738367/0']
    z=35, lon=0.000000010477378964424133  ['35/0/17179869185/0']
    z=35, lon=0.00000001047736            ['35/0/17179869184/0']
    z=35, lon=0                           ['35/0/17179869184/0']
    z=35, lon=-0.0000000000001            ['35/0/17179869183/0']
    z=35, lon=-0.000000010477378964424133 ['35/0/17179869183/0']
    z=35, lon=-179.99999998952262         ['35/0/1/0']
    z=35, lon=-179.99999998952264         ['35/0/0/0']
    z=35, lon=-180                        ['35/0/0/0']
     */
    assertEquals(0, SpatialId.calculateX(35, 180)); // 経度180は-180として扱う
    assertEquals(34359738367L, SpatialId.calculateX(35, 179.9999999999999)); // 経度180より西
    assertEquals(34359738367L, SpatialId.calculateX(35, 179.99999998952262)); // 最大インデックスの開始
    assertEquals(
        17179869185L, SpatialId.calculateX(35, 0.000000010477378964424133)); // インデックス17179869185の開始
    assertEquals(
        17179869184L, SpatialId.calculateX(35, 0.00000001047736)); // インデックス17179869185の開始より西
    assertEquals(17179869184L, SpatialId.calculateX(35, 0.0)); // インデックス17179869184の開始
    assertEquals(
        17179869183L, SpatialId.calculateX(35, -0.0000000000001)); // インデックス17179869184の開始より西
    assertEquals(
        17179869183L,
        SpatialId.calculateX(35, -0.000000010477378964424133)); // インデックス17179869183の開始
    assertEquals(1, SpatialId.calculateX(35, -179.99999998952262)); // インデックス1の開始
    assertEquals(0, SpatialId.calculateX(35, -179.99999998952264)); // インデックス1の開始より西
    assertEquals(0, SpatialId.calculateX(35, -180)); // 最小インデックスの開始
  }

  @Test
  void calculateY() {
    // ズームレベル0（共通ライブラリのズームレベルの最小値）
    /*
    z=0, lat=-85.0511287798 ['0/0/0/0']
    z=0, lat=85.0511287798  ['0/0/0/0']
    */
    // 緯度はズームレベル0では分割されない
    assertEquals(0, SpatialId.calculateY(0, -85.0511287798)); // 緯度の最南端
    assertEquals(0, SpatialId.calculateY(0, 85.0511287798)); // 最小・最大インデックスの開始

    // ズームレベル1（Axispotの扱えるズームレベルの最小値）
    /*
    z=1, lat=-85.0511287798 ['1/0/0/1']
    z=1, lat=0              ['1/0/0/1']
    z=1, lat=0.0000000001   ['1/0/0/0']
    z=1, lat=85.0511287798  ['1/0/0/0']
    */
    assertEquals(1, SpatialId.calculateY(1, -85.0511287798)); // 緯度の最南端
    assertEquals(1, SpatialId.calculateY(1, 0)); // 最大インデックスの開始
    assertEquals(0, SpatialId.calculateY(1, 0.0000000001)); // インデックス1の開始より北
    assertEquals(0, SpatialId.calculateY(1, 85.0511287798)); // 最小インデックスの開始

    // ズームレベル26（IPAガイドラインで紹介されている最大）
    /*
    z=26, lat=-85.0511287798 ['26/0/0/67108863']
    z=26, lat=-85.051128318  ['26/0/0/67108863']
    z=26, lat=-85.051128317  ['26/0/0/67108862']
    z=26, lat=-85.0511278543 ['26/0/0/67108862']
    z=26, lat=-0.0000053645  ['26/0/0/33554433']
    z=26, lat=-0.0000053644  ['26/0/0/33554432']
    z=26, lat=0              ['26/0/0/33554432']
    z=26, lat=0.0000000001   ['26/0/0/33554431']
    z=26, lat=0.0000053644   ['26/0/0/33554431']
    z=26, lat=85.051128317   ['26/0/0/1']
    z=26, lat=85.051128318   ['26/0/0/0']
    z=26, lat=85.0511287798  ['26/0/0/0']
    */
    assertEquals(67108863, SpatialId.calculateY(26, -85.0511287798)); // 緯度の最南端
    assertEquals(67108863, SpatialId.calculateY(26, -85.051128318)); // 最大インデックスの開始
    assertEquals(67108862, SpatialId.calculateY(26, -85.051128317)); // 最大インデックスの開始より北
    assertEquals(67108862, SpatialId.calculateY(26, -85.0511278543)); // インデックス67108862の開始
    assertEquals(33554433, SpatialId.calculateY(26, -0.0000053645)); // インデックス33554433の開始
    assertEquals(33554432, SpatialId.calculateY(26, -0.0000053644)); // インデックス33554433の開始より北
    assertEquals(33554432, SpatialId.calculateY(26, 0.0)); // インデックス33554432の開始
    assertEquals(33554431, SpatialId.calculateY(26, 0.0000000001)); // インデックス33554432の開始より北
    assertEquals(33554431, SpatialId.calculateY(26, 0.0000053644)); // インデックス33554431の開始
    assertEquals(1, SpatialId.calculateY(26, 85.051128317)); // インデックス1の開始
    assertEquals(0, SpatialId.calculateY(26, 85.051128318)); // インデックス1の開始より北
    assertEquals(0, SpatialId.calculateY(26, 85.0511287798)); // 最小インデックスの開始

    // ズームレベル35（共通ライブラリの最大ズームレベル）
    /*
    z=35, lat=-85.0511287798 ['35/0/0/34359738367']
    z=35, lat=-85.0511287790 ['35/0/0/34359738367']
    z=35, lat=-85.0511287789 ['35/0/0/34359738366']
    z=35, lat=-85.0511287780 ['35/0/0/34359738366']
    z=35, lat=-0.0000000105  ['35/0/0/17179869185']
    z=35, lat=-0.0000000103  ['35/0/0/17179869184']
    z=35, lat=0              ['35/0/0/17179869184']
    z=35, lat=0.0000000001   ['35/0/0/17179869183']
    z=35, lat=0.0000000104   ['35/0/0/17179869183']
    z=35, lat=85.0511287789  ['35/0/0/1']
    z=35, lat=85.0511287790  ['35/0/0/0']
    z=35, lat=85.0511287798  ['35/0/0/0']
     */
    assertEquals(34359738367L, SpatialId.calculateY(35, -85.0511287798)); // 緯度の最南端
    assertEquals(34359738367L, SpatialId.calculateY(35, -85.0511287790)); // 最大インデックスの開始
    assertEquals(34359738366L, SpatialId.calculateY(35, -85.0511287789)); // 最大インデックスの開始より北
    assertEquals(34359738366L, SpatialId.calculateY(35, -85.0511287780)); // インデックス67108862の開始
    assertEquals(17179869185L, SpatialId.calculateY(35, -0.0000000105)); // インデックス33554433の開始
    assertEquals(17179869184L, SpatialId.calculateY(35, -0.0000000103)); // インデックス33554433の開始より北
    assertEquals(17179869184L, SpatialId.calculateY(35, 0.0)); // インデックス33554432の開始
    assertEquals(17179869183L, SpatialId.calculateY(35, 0.0000000001)); // インデックス33554432の開始より北
    assertEquals(17179869183L, SpatialId.calculateY(35, 0.0000000104)); // インデックス33554431の開始
    assertEquals(1, SpatialId.calculateY(35, 85.0511287789)); // インデックス1の開始
    assertEquals(0, SpatialId.calculateY(35, 85.0511287790)); // インデックス1の開始より北
    assertEquals(0, SpatialId.calculateY(35, 85.0511287798)); // 最小インデックスの開始
  }
}
