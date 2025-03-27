package com.nttdata.vehicleinfo.collection.weatherinformationcollector.test;

public class DynamicPropertySourceTestHelper {
  /** 環境変数で設定するプロパティのキー */
  public static class Keys {
    // 設定が必須
    public static final String HALEX_DREAM_API_KEY = "halex.dream-api.key";
    public static final String VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET =
        "vdl.api.token.request.parameters.client-secret";
    public static final String VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD =
        "vdl.api.token.request.parameters.password";
    public static final String AUTH_API_LOGIN_KEY = "auth-api.login.key";
    public static final String AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID =
        "auth-api.login.request.parameters.operator-account-id";
    public static final String AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD =
        "auth-api.login.request.parameters.account-password";

    // 他
    public static final String HALEX_DREAM_API_WIMAGE72_RESPONSE_SAVE_DIRECTORY =
        "halex.dream-api.wimage72.response.save.directory";
    public static final String AXISPOT_GEOTEMP_CONFIG = "axispot.geotemp.config";
  }
}
