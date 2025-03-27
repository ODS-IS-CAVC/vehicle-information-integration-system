# vdl-api-client

仮想データレイクAPIクライアント

## 留意事項

* 各情報収集APにて重複して実装していたVDLのAPIに接続するソースコードを集約した。
* poc環境での利用を前提としているため必要な機能のみを実装している。
    * /realms/vdl/protocol/openid-connect/token
    * /api/v1/data
        * POST

## 動作確認済みのVDLのバージョン

### VDL

2024 v1.0.1

### VDL OpenAPI Specification

20250131

## Usage

SpringBootで利用する場合は下記のテストケースを参考にすること。

* vdl-api-client/src/test/java/com/nttdata/vdl/api/client/test/TestVdApiClient.java
* vdl-api-client/src/test/java/com/nttdata/vdl/api/client/test/TestVdlApiConfig.java

設定項目は以下のyamlを参考にすること。

* vdl-api-client/src/test/resources/application.yaml