package com.nttdata.vehicleinfo.collection.targetinformationcollector.masking;

import static org.junit.jupiter.api.Assertions.*;

import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.JsonNode;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

class MaskingUtilTest {
  @TempDir Path tempDir;

  final String jsonString =
      """
          {
            "test1": "test1",
            "test2": [
              {
                "test3": "test3",
                "test4": 4,
                "test5": 5.5,
                "test6": {
                  "test7": "test7",
                  "test8": "test8"
                }
              },
              {
                "test3": "test3",
                "test4": 4,
                "test5": 5.5,
                "test6": {
                  "test7": "test7",
                  "test8": "test8"
                }
              }
            ]
          }
          """;

  @Test
  void apply() throws IOException {
    // 準備
    ObjectMapper mapper = new ObjectMapper();
    // input
    JsonNode inNode = mapper.readTree(jsonString);
    File in = tempDir.resolve("in.json").toFile();
    mapper.writeValue(in, inNode);
    // output
    File out = tempDir.resolve("out.json").toFile();

    // 実行
    // test3,test4,test5,test7をマスク処理する
    String query =
        """
            .test2[] |= (
              .test3="***" |
              .test4=9999 |
              .test5=9999.9 |
              .test6.test7="***"
            )
            """;
    MaskingUtil.applyToFile(in, query, out);

    // 検証

    // outputはtest3,test4,test5,test7のみマスクされていること
    JsonNode actualOutNode = mapper.readTree(out);
    assertEquals("test1", actualOutNode.get("test1").asText());
    for (JsonNode node : actualOutNode.get("test2")) {
      assertEquals("***", node.get("test3").asText());
      assertEquals(9999, node.get("test4").asInt());
      assertEquals(9999.9d, node.get("test5").asDouble(), 0.0);
      assertEquals("***", node.get("test6").get("test7").asText());
      assertEquals("test8", node.get("test6").get("test8").asText());
    }

    // inputはマスクされていないこと
    JsonNode actualInNode = mapper.readTree(in);
    assertEquals(mapper.writeValueAsString(inNode), mapper.writeValueAsString(actualInNode));
  }

  @Test
  void apply_NG() throws IOException {
    // 準備
    ObjectMapper mapper = new ObjectMapper();
    // input
    JsonNode inNode = mapper.readTree(jsonString);
    File in = tempDir.resolve("in.json").toFile();
    mapper.writeValue(in, inNode);
    // 存在しないファイル
    File noSuchFile = tempDir.resolve("NO_SUCH_FILE").toFile();
    assertFalse(noSuchFile.exists());

    // 実行と検証
    // クエリ実行結果が複数ノードになる場合はIllegalArgumentException
    assertThrows(
        IllegalArgumentException.class,
        () -> {
          MaskingUtil.applyToFile(in, ".test2[] | .test3", noSuchFile);
        });
    // マスク処理結果のファイルが作成されていないこと
    assertFalse(noSuchFile.exists());

    // 不正なクエリが指定された場合はUncheckedIOExceptionが発生すること
    assertThrows(
        UncheckedIOException.class,
        () -> {
          MaskingUtil.applyToFile(in, "", noSuchFile);
        });
    // マスク処理結果のファイルが作成されていないこと
    assertFalse(noSuchFile.exists());

    // 不正なinputが指定された場合はUncheckedIOExceptionが発生すること
    assertThrows(
        UncheckedIOException.class,
        () -> {
          MaskingUtil.applyToFile(noSuchFile, ".test2[].test3=\"***\"", noSuchFile);
        });
    // マスク処理結果のファイルが作成されていないこと
    assertFalse(noSuchFile.exists());

    // 不正なoutputが指定された場合はUncheckedIOExceptionが発生すること
    assertThrows(
        UncheckedIOException.class,
        () -> {
          File invalid = tempDir.resolve("INVALID_OUT.json").toFile();
          Files.createDirectories(invalid.toPath());
          MaskingUtil.applyToFile(in, ".test2[].test3=\"***\"", invalid);
        });
  }
}
