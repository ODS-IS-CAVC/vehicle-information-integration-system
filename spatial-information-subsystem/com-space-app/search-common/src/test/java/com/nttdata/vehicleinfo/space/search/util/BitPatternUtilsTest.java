package com.nttdata.vehicleinfo.space.search.util;

import static org.assertj.core.api.Assertions.assertThat;

import jp.co.ntt.sic.config.BitPattern;
import jp.co.ntt.sic.config.GeotempConfig;
import org.junit.jupiter.api.Test;

public class BitPatternUtilsTest {

  @Test
  public void vehicleBitPattern() {
    GeotempConfig config =
        new GeotempConfig(
            "localhost:6379", // 実際にはRedisに繋がないため適当な値
            BitPattern.parseString(
                "tttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:52:ZFXY"));
    // ズームレベル11は8192秒の解像度
    long resolutionZ11 = BitPatternUtils.getTimeResolution(config, 11);
    assertThat(resolutionZ11).isEqualTo(8192);

    // ズームレベル15は512秒の解像度
    long resolutionZ15 = BitPatternUtils.getTimeResolution(config, 15);
    assertThat(resolutionZ15).isEqualTo(512);

    // ズームレベル24は1秒の解像度
    long resolutionZ24 = BitPatternUtils.getTimeResolution(config, 24);
    assertThat(resolutionZ24).isEqualTo(1);
  }

  @Test
  public void lessThan1sec() {
    // 1秒以下の解像度とするため時刻ビットtを32個含んだビットパターンを指定する
    GeotempConfig config =
        new GeotempConfig(
            "localhost:6379", // 実際にはRedisに繋がないため適当な値
            BitPattern.parseString(
                "tttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:56:ZFXY"));
    // ズームレベル25は0.5秒の解像度になるが1秒として扱う
    long resolutionZ11 = BitPatternUtils.getTimeResolution(config, 25);
    assertThat(resolutionZ11).isEqualTo(1);
  }
}
