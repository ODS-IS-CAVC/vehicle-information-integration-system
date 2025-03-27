# 空間ID検索APのソースファイル

## フォルダ構成

| 名前 | フォルダ | 概要 |
| ---- | ------- | ---- |
| 空間ID検索共通モジュール | `./search-common/` | 空間ID検索における共通の実装を格納 |
| 気象情報検索モジュール | `./search-weather-api/` | 気象情報検索の実装を格納 |
| 車両・物標情報検索モジュール | `./search-vehicle-api/` | 車両・物標情報検索の実装を格納 |
| ダミーデータ生成モジュール | `./testdata-creator` | ダミーデータを生成するツールの実装を格納 |

## 設定ファイル
SpringBootのアプリケーションプロパティとして設定を行なう。
### 車両・物標情報検索
```yaml
server:
  port: 8081

axispot:
  storeNodeInfo: "localhost:16379"
  bitPattern: "tttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:52:ZFXY"
```

| 設定名 | 概要 |
| -- | -- |
| server.port | アプリケーションを待ち受けるポート番号 |
| axispot.storeNodeInfo | Axispotのノード情報(Axispotクライアントの`storeNodeInfo`に相当) |
| axispot.bitPattern | Axispotのビットパターン(Axispotクライアントの`bitPattern`に相当、収集APと揃えること) |

### 気象情報検索
```yaml
server:
  port: 8082

axispot:
  storeNodeInfo: "localhost:16379"
  bitPattern: "tttttttttttttttttttttttttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:38:ZFXY"
```

| 設定名 | 概要 |
| -- | -- |
| server.port | アプリケーションを待ち受けるポート番号 |
| axispot.storeNodeInfo | Axispotのノード情報(Axispotクライアントの`storeNodeInfo`に相当) |
| axispot.bitPattern | Axispotのビットパターン(Axispotクライアントの`bitPattern`に相当、収集APと揃えること) |

## ビルド方法

### 前提条件

#### AWS CLI

* プロファイル名`digiline`を設定済みであること

#### CodeArtifact

* CodeArtifactにAxispot時空間データ高速検索ライブラリ`jp.co.ntt.sic.Geotemp`が存在すること
  * (必要に応じて)GeotempはOpenAPI定義を参照して実装すること

### ビルド手順

1. (必要に応じて) `gradle.properties`内のプロファイル名を修正する
```
# CodeArtifact authorization profile.
AWS_PROFILE=digiline
```
2. `gradlew`によりビルドを実行する
    * ユニットテストを実行する場合、 `gradlew`を実行するホスト上で `docker`コマンドが利用可能であること
```bash
./gradlew clean build -x test
```

## 実行方法
以下に各種アプリケーションの実行方法例を示す。  
実際にdev環境およびpoc環境に配置するファイルは、各モジュールの `config`ディレクトリおよび`src/main/resources`ディレクトリ内に配置してある。

### 前提条件

* アプリケーションの実行用ユーザー`digiline`が作成済みであること
    * `$ sudo useradd -M -s /sbin/nologin -U digiline`

### 車両・物標情報検索
#### ファイルの配置
以下のようにファイルを配置する。
```
/opt/search-vehicle-api
├ bin/
│  └ bootstrap.sh                         # 実行スクリプト
├ config/
│  └ application.yaml                     # 設定ファイル
└ lib/
    └ search-vehicle-api-1.0-SNAPSHOT.jar  # search-vehicle-api/build/lib/に存在するjarファイル
```
#### 実行スクリプト(bootstrap.sh)
```bash
#!/bin/bash

APP_HOME=$(cd $(dirname ${BASH_SOURCE:-$0})/..; pwd)
JAR=${APP_HOME}/lib/search-vehicle-api-1.0-SNAPSHOT.jar

cd ${APP_HOME}

# application.yamlが${APP_HOME}/configにある前提

java -jar ${JAR}
```

#### 設定ファイル(application.yaml)
```yaml
server:
  port: 8081

axispot:
  storeNodeInfo: "clustercfg.poc-space-redis-tier4.soila4.apne1.cache.amazonaws.com:6379" 
  bitPattern: "tttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:52:ZFXY" 
```
#### systemdユニットファイル
search-vehicle-apiを常時起動するためsystemdユニットファイル(`/etc/systemd/system/search-vehicle-api.service`)を以下のように作成する。
```
[Unit]
Description=Search vehicle API
After=network.target

[Service]
User=digiline
ExecStart=/opt/search-vehicle-api/bin/bootstrap.sh
SuccessExitStatus=143
Restart=always

[Install]
WantedBy=multi-user.target
```
#### アプリケーションの所有者変更
```bash
sudo chown -R digiline:digiline /opt/search-vehicle-api
```
#### 起動用スクリプトに実行権限を付与
```bash
sudo chmod 755 /opt/search-vehicle-api/bin/bootstrap.sh
```
#### アプリケーションの常時起動
```bash
sudo systemctl enable search-vehicle-api
```
#### アプリケーションの実行
```bash
sudo systemctl start search-vehicle-api
```
#### ログの確認
```bash
sudo journalctl -u search-vehicle-api -f
```

### 気象情報検索
#### ファイルの配置
以下のようにファイルを配置する。
```
/opt/search-weather-api
├ bin/
│  └ bootstrap.sh                         # 実行スクリプト
├ config/
│  └ application.yaml                     # 設定ファイル
└ lib/
    └ search-weather-api-1.0-SNAPSHOT.jar  # search-weather-api/build/lib/に存在するjarファイル
```
#### 実行スクリプト(bootstrap.sh)
```bash
#!/bin/bash

APP_HOME=$(cd $(dirname ${BASH_SOURCE:-$0})/..; pwd)
JAR=${APP_HOME}/lib/search-weather-api-1.0-SNAPSHOT.jar

cd ${APP_HOME}

# application.yamlが${APP_HOME}/configにある前提

java -jar ${JAR}
```

#### 設定ファイル(application.yaml)
```yaml
server:
  port: 8082

axispot:
  storeNodeInfo: "clustercfg.poc-space-redis-halex.soila4.apne1.cache.amazonaws.com:6379" 
  bitPattern: "tttttttttttttttttttttttttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:38:ZFXY" 
```
#### systemdユニットファイル
search-weatehr-apiを常時起動するためsystemdユニットファイル(`/etc/systemd/system/search-weather-api.service`)を以下のように作成する。
```
[Unit]
Description=Search weather API
After=network.target

[Service]
User=digiline
ExecStart=/opt/search-weather-api/bin/bootstrap.sh
SuccessExitStatus=143
Restart=always

[Install]
WantedBy=multi-user.target
```
#### アプリケーションの所有者変更
```bash
sudo chown -R digiline:digiline /opt/search-weatehr-api
```
#### 起動用スクリプトに実行権限を付与
```bash
sudo chmod 755 /opt/search-weatehr-api/bin/bootstrap.sh
```
#### アプリケーションの常時起動
```bash
sudo systemctl enable search-weatehr-api
```
#### アプリケーションの実行
```bash
sudo systemctl start search-weatehr-api
```
#### ログの確認
```bash
sudo journalctl -u search-weatehr-api -f
```
