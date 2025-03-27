package com.nttdata.vehicleinfo.space.search.util;

import java.lang.invoke.MethodHandles;
import jp.co.ntt.sic.config.GeotempConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** ビットパターンに関する汎用関数を実装したUtilクラス. */
public class BitPatternUtils {

  private static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  /** ビット列構成上の時間に対応する文字 */
  private static final char timeAxis = 't';

  /**
   * 与えられたビットパターンに含まれる時刻ビット数およびズームレベルから Axispotの検索時の時空間インデックスの時間解像度を返却する.
   *
   * @param config GeotempConfigオブジェクト
   * @param zoom 検索時ズームレベル
   * @return 時空間インデックスの時間解像度
   */
  public static long getTimeResolution(GeotempConfig config, int zoom) {
    /*
     時間の表現可能範囲(timeMin～timeMax)をビットパターンで表現するときの、
     1bitあたりの時間解像度を算出する。
     ここの実装はAxispotの以下の実装から解像度算出のみを抜き出したものである。
     <ul>
       <li>jp.co.ntt.sic.timespaceindex.ZfxyTimeSpaceIndexCreator#L84</li>
       <li>jp.co.ntt.sic.timespaceindex.TimeSpaceIndexCreatorHelper#L25</li>
     </ul>
     ZFXYでは、実質2^31をtimeNumの回数だけ1/2すればいいのだが、実装を踏襲してminとmaxを使って算出している。
    */
    // キー及びスコア計算に利用するビット長
    // jp.co.ntt.sic.SearchParameter#L53あたりを参照
    int searchPrecision = config.getBitPattern().convertZfxyZoomToSearchPrecision(zoom);
    // 検索に利用するビット配列内のtビット数を数える
    long bitNum =
        config
            .getBitPattern()
            .getBitConstitution()
            .substring(0, searchPrecision)
            .chars()
            .filter(c -> c == timeAxis)
            .count();

    long availableBit = 1L << bitNum;
    long resolution = (config.getTimeMax() - config.getTimeMin()) / availableBit;

    // 時間ビットが32ビット以上の場合、時間解像度が1秒未満となるためlongでの計算結果が0となる、
    // Axispotは秒単位での検索を行なうため最小の時間解像度として1秒を返却する
    if (resolution > 0) {
      return resolution;
    } else {
      log.warn(
          "Bit pattern with a time resolution of less than 1 second, set the time resolution to 1 second.");
      return 1L;
    }
  }
}
