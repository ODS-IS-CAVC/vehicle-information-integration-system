package com.nttdata.vdl.api.client.test;

public class DynamicPropertySourceTestHelper {
  /** 環境変数で設定するプロパティのキー */
  public static class Keys {
    // 設定が必須
    public static final String VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET =
        "vdl.api.token.request.parameters.client-secret";
    public static final String VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD =
        "vdl.api.token.request.parameters.password";
  }
}
