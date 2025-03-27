# 情報収集APのソースファイル

## 構成

| 名称                        | フォルダ                                                                     | CodeAirtifact                                                                                                                                                                                                                              |
|:--------------------------|:-------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 空間ID生成ライブラリ               | [spatial-index-creator](spatial-index-creator)                           | [Open](https://ap-northeast-1.console.aws.amazon.com/codesuite/codeartifact/d/324037315774/nttd-tig/r/com-space-codeartifact/p/maven/com.nttdata.vehicleinfo.collection/spatial-index-creator/versions?region=ap-northeast-1)              |
| 時空間ID生成ライブラリ（気象情報）        | [time-spatial-index-creator-weather](time-spatial-index-creator-weather) | [Open](https://ap-northeast-1.console.aws.amazon.com/codesuite/codeartifact/d/324037315774/nttd-tig/r/com-space-codeartifact/p/maven/com.nttdata.vehicleinfo.collection/time-spatial-index-creator-weather/versions?region=ap-northeast-1) |
| 時空間ID生成ライブラリ（車両情報）        | [time-spatial-index-creator-vehicle](time-spatial-index-creator-vehicle) | [Open](https://ap-northeast-1.console.aws.amazon.com/codesuite/codeartifact/d/324037315774/nttd-tig/r/com-space-codeartifact/p/maven/com.nttdata.vehicleinfo.collection/time-spatial-index-creator-vehicle/versions?region=ap-northeast-1) |
| 時空間ID生成ライブラリ（物標情報）        | [time-spatial-index-creator-target](time-spatial-index-creator-target)   | [Open](https://ap-northeast-1.console.aws.amazon.com/codesuite/codeartifact/d/324037315774/nttd-tig/r/com-space-codeartifact/p/maven/com.nttdata.vehicleinfo.collection/time-spatial-index-creator-target/versions?region=ap-northeast-1)  |
| 気象情報収集AP                  | [weather-information-collector](weather-information-collector)           | -                                                                                                                                                                                                                                          |
| 車両情報収集AP                  | [vehicle-information-collector](vehicle-information-collector)           | -                                                                                                                                                                                                                                          |
| 物標情報収集AP                  | [target-information-collector](target-information-collector)             | -                                                                                                                                                                                                                                          |
| axispot_zfxy_mesh_preview | [tools/axispot_zfxy_mesh_preview](tools%2Faxispot_zfxy_mesh_preview)     | -                                                                                                                                                                                                                                          |
| 仮想データレイクAPIクライアント         | [vdl-api-client](vdl-api-client)                                         | -                                                                                                                                                                                                                                          |

## ビルド手順

### 前提条件

#### Java

* Java21がインストール済みであること。

```
$ java --version
openjdk 21.0.5 2024-10-15
OpenJDK Runtime Environment (build 21.0.5+11-Ubuntu-1ubuntu124.04)
OpenJDK 64-Bit Server VM (build 21.0.5+11-Ubuntu-1ubuntu124.04, mixed mode, sharing)
```

#### AWS CLI

※必要があれば実施する。

* AWS CLIがインストール済みであること。

```
$ aws --version
aws-cli/2.22.7 Python/3.12.6 Linux/6.8.0-1021-aws exe/x86_64.ubuntu.24
```

* プロファイル名`digiline`を設定済みであること。

```
$ aws configure list --profile digiline
      Name                    Value             Type    Location
      ----                    -----             ----    --------
   profile                 digiline           manual    --profile
access_key     ******************** shared-credentials-file
secret_key     ******************** shared-credentials-file
    region           ap-northeast-1             imds
```

#### CodeCommit

※必要があれば実施する。

* CodeCommitに接続できること。

```
$ git ls-remote https://git-codecommit.ap-northeast-1.amazonaws.com/v1/repos/com-collection-app
```

#### CodeArtifact

※必要があれば実施する。

* CodeArtifactの認証トークンが取得できること。

```
$ aws codeartifact get-authorization-token \
      --profile digiline \
      --domain nttd-tig \
      --domain-owner 324037315774 \
      --region ap-northeast-1 \
      --query authorizationToken \
      --output text
```

* CodeArtifactにAxispot時空間データ高速検索ライブラリ`jp.co.ntt.sic.Geotemp`が存在すること。
    * (必要に応じて)GeotempはOpenAPI定義を参照して実装すること

```
$ aws codeartifact list-package-versions \
      --profile digiline \
      --domain nttd-tig \
      --domain-owner 324037315774 \
      --repository com-space-codeartifact \
      --namespace jp.co.ntt.sic \
      --package Geotemp \
      --format maven
```

### ビルドコマンド実行

* 作業ディレクトリに移動
    * `$ cd com-collection-app/`
* ビルドツールに実行権限付与
    * `$ chmod +x ./gradlew`
* ビルド実行
    * `$ ./gradlew clean bootJar -x test`
        * ※`bootJar`でSpringBootのJARファイルを生成する。
        * ※`-x test`でUnitTestをスキップする。

## 情報収集APの配備手順

### 前提条件

* [ビルド手順](#ビルド手順)を実施済みであること。
* 情報収集AP実行用ユーザー`digiline`が作成済みであること。
    * `$ sudo useradd -M -s /sbin/nologin -U digiline`

### 対象ファイル

配備する対象ファイルは以下の通りである。

1. 情報収集APのJARファイル
2. Axispot設定ファイル
3. 起動用スクリプト
4. Unitファイル
5. SpringBoot設定ファイル（共通）
6. SpringBoot設定ファイル（環境別）

```
com-collection-app
  |--{APP_NAME}
     |--build
     |  |--libs
     |     |--{APP_NAME}-0.0.1-SNAPSHOT.jar                       #1
     |--config
     |  |--axispot
     |  |  |--geotempConfig-{SPRING_PROFILES_ACTIVE}.properties   #2
     |  |--bin
     |  |  |--bootstrap.sh                                        #3
     |  |--systemd
     |  |  |--{APP_NAME}.service                                  #4
     |--src
        |--main
           |--resources
              |--application.yaml                                 #5
              |--application-{SPRING_PROFILES_ACTIVE}.yaml        #6
```

※`{APP_NAME}`は情報収集AP名（`weather-information-collector` / `vehicle-information-collector`
/ `target-information-collector`）を設定する。

※`{SPRING_PROFILES_ACTIVE}`は環境名（`dev` / `poc`）を設定する。

### 配備先

各対象ファイルの配備先は以下の通りである。

```
{APP_HOME}
  |--bin
  |  |--bootstrap.sh                                              #3
  |--config
  |  |--application.yaml                                          #5
  |  |--application-{SPRING_PROFILES_ACTIVE}.yaml                 #6
  |  |--axispot
  |  |  |--geotempConfig-{SPRING_PROFILES_ACTIVE}.properties      #2
  |--lib
     |--{APP_NAME}-0.0.1-SNAPSHOT.jar                             #1

/etc/systemd/system/
  |--{APP_NAME}.service                                           #4
```

※`{APP_HOME}`はデフォルトで`/opt/{APP_NAME}`とする。

### 共通設定

* 起動用スクリプトに実行権限を付与する。
    * `$ sudo chmod 755 bootstrap.sh`
* Unitファイルの再読み込みをする。
    * `$ sudo systemctl daemon-reload`
* Unitファイルの自動起動を有効にする。
    * `$ sudo systemctl enable {APP_NAME}.service`
* 所有者を実行用ユーザーに変更する。
    * `$ sudo chown -R digiline:digiline {APP_HOME}`

### 環境変数の設定

環境変数は配備先の`bootstrap.sh`にて設定すること。

各APの動作に必要な環境変数は以下の通りである。

#### 気象情報収集APの環境変数

| 設定名                                            | 概要                          |
|------------------------------------------------|-----------------------------|
| HALEX_DREAMAPI_KEY                             | ハレックス社から発行されるAPIキー          |
| VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET | 仮想データレイクから発行されるクライアントシークレット |
| VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD      | 仮想データレイクから発行されるパスワード        |

#### 車両情報収集APの環境変数

| 設定名                                                           | 概要                                |
|---------------------------------------------------------------|-----------------------------------|
| VEHICLE_TIER4_DIGITAL_ZENSO_API_KEY                           | tier4から発行されるAPIキー（車両情報）           |
| VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET        | 仮想データレイクから発行されるクライアントシークレット（車両情報） |
| VEHICLE_VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD             | 仮想データレイクから発行されるパスワード（車両情報）        |
| VEHICLE_AUTH_API_LOGIN_KEY                                    | データ流通層から発行されるログインキー（車両情報）         |
| VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID | データ流通層から発行されるオペレーターアカウントID（車両情報）  |
| VEHICLE_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD    | データ流通層から発行されるアカウントパスワード（車両情報）     |

#### 物標情報収集APの環境変数

| 設定名                                                          | 概要                                |
|--------------------------------------------------------------|-----------------------------------|
| TARGET_TIER4_TARGET_INFO_API_KEY                             | tier4から発行されるAPIキー（物標情報）           |
| TARGET_VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET        | 仮想データレイクから発行されるクライアントシークレット（物標情報） |
| TARGET_VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD             | 仮想データレイクから発行されるパスワード（物標情報）        |
| TARGET_AUTH_API_LOGIN_KEY                                    | データ流通層から発行されるログインキー（物標情報）         |
| TARGET_AUTH_API_LOGIN_REQUEST_PARAMETERS_OPERATOR_ACCOUNT_ID | データ流通層から発行されるオペレーターアカウントID（物標情報）  |
| TARGET_AUTH_API_LOGIN_REQUEST_PARAMETERS_ACCOUNT_PASSWORD    | データ流通層から発行されるアカウントパスワード（物標情報）     |

### 起動

* 気象情報収集AP
    * `$ sudo systemctl start weather-information-collector`
* 車両情報収集AP
    * `$ sudo systemctl start vehicle-information-collector`
* 物標情報収集AP
    * `$ sudo systemctl start target-information-collector`

### ログ確認

* 気象情報収集AP
    * `$ tail /opt/weather-information-collector/logs/weather-information-collector.log`
* 車両情報収集AP
    * `$ tail /opt/vehicle-information-collector/logs/vehicle-information-collector.log`
* 物標情報収集AP
    * `$ tail /opt/target-information-collector/logs/target-information-collector.log`

## カバレッジレポートの生成

カバレッジレポートを生成する場合は以下のコマンドを実施する。

* `$ ./gradlew clean jacocoTestReport`
    * 各プロジェクトの`build/jacocoHtml`に出力される

## JavaDocの生成

JavaDocを生成する場合は以下のコマンドを実施する。

* `$ ./gradlew javadoc`
    * 各プロジェクトの`build/docs/javadoc`に出力される

## CodeArtifact公開手順

インデックス生成ライブラリ（空間ID生成ライブラリ、時空間ID生成ライブラリ群）を、情報収集AP以外で利用する場合のライブラリ公開方法の一例としてCodeArtifactへの公開手順を記載する。

### 前提条件

* [ビルド手順](#ビルド手順)の前提条件を満たしていること。
* [gradle.properties](gradle.properties)にCodeArtifactの認証トークンを取得できるAWS CLIのプロファイルを設定していること。

```
# CodeArtifact authorization profile.
AWS_PROFILE=digiline
```

### 公開コマンド実行

* 空間ID生成ライブラリ
    * `$ ./gradlew clean spatial-index-creator:publish`
* 時空間ID生成ライブラリ（気象情報）
    * `$ ./gradlew clean time-spatial-index-creator-weather:publish`
* 時空間ID生成ライブラリ（車両情報）
    * `$ ./gradlew clean time-spatial-index-creator-vehicle:publish`
* 時空間ID生成ライブラリ（物標情報）
    * `$ ./gradlew clean time-spatial-index-creator-target:publish`

### 確認

CodeArtifactのAWSマネジメントコンソールにてリポジトリ`com-space-codeartifact`への反映を確認すること。

## TIPS

### CodeCommitの認証をAWS CLIでする設定

```
$ git config --global credential.helper '!aws --profile digiline codecommit credential-helper $@'
$ git config --global credential.UseHttpPath true
```

### 情報収集APが自動で生成するフォルダ

```
{APP_NAME}
   |--logs    # ログファイル保存
   |--data    # レスポンスファイル保存
```

### 情報収集APのログの保持期間

7日前まで保持する。

### 空間IDを地図上に可視化する

axispot_zfxy_mesh_previewを利用する。

※使い方は[README.md](tools%2Faxispot_zfxy_mesh_preview%2FREADME.md)を参照する。