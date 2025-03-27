package com.nttdata.vehicleinfo.collection.vehicleinformationcollector.masking;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.lang.invoke.MethodHandles;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.List;
import net.thisptr.jackson.jq.BuiltinFunctionLoader;
import net.thisptr.jackson.jq.JsonQuery;
import net.thisptr.jackson.jq.Scope;
import net.thisptr.jackson.jq.Versions;
import net.thisptr.jackson.jq.module.loaders.BuiltinModuleLoader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * MaskingUtil
 *
 * <p>機微情報をマスキングするための機能を提供する。
 *
 * <p><a href="https://github.com/eiiches/jackson-jq">jackson-jqライブラリ</a>を利用する。
 */
public class MaskingUtil {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final ObjectMapper MAPPER = new ObjectMapper();

  private static final Scope rootScope = Scope.newEmptyScope();

  private MaskingUtil() {}

  static {
    // jackson-jq settings
    // https://github.com/eiiches/jackson-jq/blob/develop/1.x/jackson-jq/src/test/java/examples/Usage.java
    BuiltinFunctionLoader.getInstance().loadFunctions(Versions.JQ_1_6, rootScope);
    rootScope.setModuleLoader(BuiltinModuleLoader.getInstance());
  }

  /**
   * ファイル指定でjqクエリを適用する。
   *
   * <p>入力JSONファイルから読み込んだJSONデータにjqクエリを適用した結果を出力JSONファイルに書き込む。
   *
   * @param in 入力JSONファイル
   * @param query jaクエリ
   * @param out 出力JSONファイル
   * @throws IllegalArgumentException jqクエリの適用結果が複数ノードになる場合
   * @throws UncheckedIOException ファイルの入出力でIOExceptionが発生した場合
   */
  public static void applyToFile(File in, String query, File out) {
    try {
      JsonNode inJson = MAPPER.readTree(in);

      // jackson-jqの準備
      Scope childScope = Scope.newChildScope(rootScope);
      JsonQuery q = JsonQuery.compile(query, Versions.JQ_1_6);

      // 結果格納用リスト
      final List<JsonNode> resultList = new ArrayList<>();

      // jqクエリ実行
      q.apply(childScope, inJson, resultList::add);

      // 結果が複数ノードの場合はマスク失敗とする
      if (resultList.size() > 1) {
        String msg = MessageFormat.format("マスク処理の結果が不正: resultList={0}", resultList);
        throw new IllegalArgumentException(msg);
      }

      // 結果をoutに書き込み
      MAPPER.writeValue(out, resultList.getFirst());

      logger.debug("inJson: {}", inJson);
      logger.debug("outJson: {}", resultList.getFirst());
    } catch (IOException e) {
      logger.debug("exception", e);
      logger.debug("in={},query={},out={}", in, query, out);
      throw new UncheckedIOException(e);
    }
  }
}
