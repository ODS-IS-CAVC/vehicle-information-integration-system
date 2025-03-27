package com.nttdata.vdl.api.client.test;

import java.lang.invoke.MethodHandles;
import java.nio.file.Path;
import java.nio.file.Paths;

public class ResourceTestHelper {
  public static final String FILE_NAME_TEST = "test.json";
  public static final String FILE_NAME_POST_IOEXCEPTION = "post_ioexception.json";

  public static Path getPostTestFilePath() {
    return getResourceAsPath(Paths.get(FILE_NAME_TEST).toString());
  }

  public static Path getPostIOExceptionFilePath() {
    return getResourceAsPath(Paths.get(FILE_NAME_POST_IOEXCEPTION).toString());
  }

  public static Path getResourceAsPath(String filePath) {
    try {
      Path path =
          Paths.get(
              MethodHandles.lookup().lookupClass().getClassLoader().getResource(filePath).toURI());
      return path;
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
