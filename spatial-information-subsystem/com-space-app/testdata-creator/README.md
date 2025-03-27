# ダミーデータ作成モジュール

結合検証および実証検証で利用するダミーデータを作成するためのツール。

## 設定
### 設定ファイル
```yaml
axispot:
  storeNodeInfo: "localhost:16379"
  bitPattern: "tttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:52:ZFXY"
  cacheTtl: 259200 # 3day

testdata:
  randomDataOutputDir: "./data/"
  randomDataBaseTime: "2024-11-12T10:00:00+09:00"
  randomDataDuration: 1h
  randomData:
    - id: "1_1"
      name: "車両情報: 1_1(1_駿河湾沼津SA→新富士IC_1)"
      templateType: Vehicle
      interval: 5s
      updatedAtOffset: 1h
      areas:
        - boundingBoxes:
          - swLon: 138.812255859375
            swLat: 35.14686290675629
            neLon: 138.8232421875
            neLat: 35.15584570226543
          coordinate:
            longitude: 138.812255859375
            latitude: 35.15584570226543
            altitude: 0.0
      staticAttributes:
        weatherForecast: "100"
        windSpeed: "0.0"
        precipitation: "0.0"
```

### 設定項目
* `axispot.storeNodeInfo`
    * Axispotの接続先
* `axispot.bitPattern`
    * Axispotのビットパターン
* `axispot.cacheTtl`
    * AxispotのデータのTTL(秒)
    * RedisのTTLに相当し、データ投入からの経過時間でデータが削除される
* `testdata.randomDataOutputDir`
    * 生成したランダムな座標データをCSV形式で出力するための出力先
    * 定義しないことで、CSV出力を無効化する
    * CSVファイル名は`<データ種別>_<ID>.csv`となる
* `testdata.randomDataBaseTime`
    * 生成されるデータの基準時刻
    * 各領域に生成される1つ目のデータの時刻となる
* `testdata.randomDataDuration`
    * データを生成する期間
      * 後続の`interval`の間隔でデータを生成する
      * `randomDataDuration=1h`、`interval=5m`の場合、計12個のデータが生成される
    * `数値＋単位`で指定する
      * 指定可能な単位は[Converting Durations](https://docs.spring.io/spring-boot/reference/features/external-config.html#features.external-config.typesafe-configuration-properties.conversion.durations)を参照すること
* `testdata.randomData`
    * データを生成する領域一覧
* `testdata.randomData[].id`
    * 領域ID
    * CSV出力ファイル名に利用される
* `testdata.randomData[].name`
    * 領域名
    * ログ出力等に利用される
* `testdata.randomData[].templateType`
    * データ種別
    * `Vehicle`を選択した場合、IDがUUIDとなり、Axispotのattributeが車両情報向けとなる
    * `Target`を選択した場合、IDが数値となり、Axispotのattributeが物標情報向けとなる
    * `Weather`を選択した場合、Axispotのattributesが気象情報向けとなる
      * `Weather`はIDが存在しない
* `testdata.randomData[].interval`
    * Axispotに投入するデータを生成する周期を設定する
      * ダミーデータの時刻は`randomDataBaseTime`を基準に`randomDataDuration`の間`interval`間隔で設定した値となる
    * `数値＋単位`で指定する
      * 指定可能な単位は[Converting Durations](https://docs.spring.io/spring-boot/reference/features/external-config.html#features.external-config.typesafe-configuration-properties.conversion.durations)を参照すること
* `testdata.randomData[].updatedAtOffset`
    * `updatedAt`フィールドに格納される日時情報のオフセット
    * Axispotに設定される`updatedAt`フィールドの値は生成したダミーデータの時刻に`updatedAtOffset`を加算したものとなる
    * 例) `updatedAtOffset=2h`が設定されている場合、16:00:00の気象データの持つ`updatedAt`は18:00:00となり、17:00:00の気象データが持つ`updatedAt`は19:00:00となる
* `testdata.randomData[].areas`
    * ダミーデータを生成するエリアを設定する
    * ダミーデータはintervalごとに設定したエリアの数だけ生成される
      * ただし車両および物標情報は、同じIDのデータが複数エリアに存在することを防ぐため、1番目のエリアのみ有効となる
* `testdata.randomData[].area[].boundingBoxes`
    * ダミーデータを生成するエリアを経度緯度情報から成る領域(BoundingBox)で設定する
    * ダミーデータは指定した領域内からランダムな座標を決定する
* `testdata.randomData[].area[].coordinate`
    * ダミーデータを生成するエリアを固定の緯度経度情報で設定する
    * この設定をした場合、ダミーデータの座標は常に設定した座標となり、`boundingBoxes`の設定は無視される
* `testdata.randomData[].staticAttributes`
    * Axispotの `MovingObjectValue#attributes` のMapに入るkey/valueを指定
    * 生成されたデータの属性の値を固定するために利用する
    * 一部の属性については指定不可(指定しても無視される)
        * 指定できない属性
            * `spatialId` (ツール側で生成した座標を利用するため)
            * `updatedAt`/`time` (ツール側で生成した時刻情報を利用するため)
            * 車両プローブや物標の座標情報
            * 気象情報の`type` (ツール側で実測値と予測値を格納しているため)

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
```bash
./gradlew :testdata-creator:clean :testdata-creator:build -x test
```

## 実行方法

### ツール起動手順
SpringBootのプロファイルを切り替えることで投入するデータおよび投入先を変更する。  
指定するプロファイルは以下の2つ。
* Axispot接続先プロファイル
* ダミーデータ定義プロファイル
```bash
java -jar ./testdata-creator/build/libs/testdata-creator-1.0-SNAPSHOT.jar --spring.profiles.active=poc-halex,c4-weather-202502120900
```

## プロファイル一覧
### Axispot接続先プロファイル

| プロファイル名   | 内容                    |
|-----------|-----------------------|
| poc-halex | poc環境の気象情報向けAxispot   |
| poc-tier4 | poc環境の車両物標情報向けAxispot |
| dev-halex | dev環境の気象情報向けAxispot   |
| dev-tier4 | dev環境の車両物標情報向けAxispot |

### ダミーデータ定義プロファイル
#### 実証検証(気象情報ダミーデータ)
02/07時点での気象情報リクエストから作成された気象情報のダミーデータのプロファイル。

| プロファイル名 | 内容 | 実行タイミング | 実証実験中のリアルタイムでの実行有無 |
| -- | -- | -- | -- |
| `c4-weather-202502120900` | 2/12のリクエスト向けデータ | | |
| `c4-weather-202502130900` | 2/13のリクエスト向けデータ | | |
| `c4-weather-202502140900-tunnel` | 2/14の12時以降のトンネル侵入時のリクエスト向けデータ | 2/14 12時以前 | |
| `c4-weather-202502141400-tunnel-exit` | 2/14の12時以降のトンネル出口通過後のリクエスト向けデータ | 2/14 12時以降のトンネル出口通過後 | 〇 |
| `c4-weather-202502180700` | 2/18の7時のリクエスト向けデータ | 2/18 7時以前 | |
| `c4-weather-202502180900` | 2/18の9時以降のリクエスト向けデータ | 2/18 9時直前 | 〇 |
| `c4-weather-202502180900-tunnel` | 2/18の9時以降のトンネル侵入時のリクエスト向けデータ | 2/18 9時のリクエスト完了後 | 〇 |
| `c4-weather-202502180900-tunnel-exit` | 2/18の9時以降のトンネル出口通過後のリクエスト向けデータ | 2/18 9時以降のトンネル出口通過後 | 〇 |
| `c4-weather-202502181300-tunnel` | 2/18の13時以降のトンネル侵入時のリクエスト向けデータ | 2/18 13時のリクエスト完了後 | 〇 |
| `c4-weather-202502181300-tunnel-exit` | 2/18の13時以降のトンネル出口通過後のリクエスト向けデータ | 2/18 13時以降のトンネル出口通過後 | 〇 |
| `c4-weather-202502210900` | 2/21のリクエスト向けデータ | | |
| `c4-weather-202502251000` | 2/25の10時から20時のリクエスト向けデータ | 2/25 10時以前 | |
| `c4-weather-202502251300-tunnel` | 2/25の13時以降のトンネル侵入時のリクエスト向けデータ | 2/25 13時のリクエスト完了後 | 〇 |
| `c4-weather-202502251300-tunnel-exit` | 2/25の13時以降のトンネル出口通過後のリクエスト向けデータ | 2/25 13時以降のトンネル出口通過後 | 〇 |
| `c4-weather-202502252100` | 2/25の21時のリクエスト向けデータ | 2/25 21時直前 | 〇 |
| `c4-weather-202502252100-tunnel` | 2/25の21時以降のトンネル侵入時のリクエスト向けデータ | 2/25 21時のリクエスト完了後 | 〇 |
| `c4-weather-202502252100-tunnel-exit` | 2/25の21時以降のトンネル出口通過後のリクエスト向けデータ | 2/25 21時以降のトンネル出口通過後 | 〇 |
| `c4-weather-202502260700` | 2/26の7時のリクエスト向けデータ | 2/26 7時以前 | |
| `c4-weather-202502260900` | 2/26の9時から18時のリクエスト向けデータ | 2/25 9時直前 | 〇 |
| `c4-weather-202502260900-tunnel` | 2/26の9時以降のトンネル侵入時のリクエスト向けデータ | 2/26 9時のリクエスト完了後 | 〇 |
| `c4-weather-202502260900-tunnel-exit` | 2/26の9時以降のトンネル出口通過後のリクエスト向けデータ | 2/26 9時以降のトンネル出口通過後 | 〇 |
| `c4-weather-202502261300-tunnel` | 2/26の13時以降のトンネル侵入時のリクエスト向けデータ | 2/26 13時のリクエスト完了後 | 〇 |
| `c4-weather-202502261300-tunnel-exit` | 2/26の13時以降のトンネル出口通過後のリクエスト向けデータ | 2/26 13時以降のトンネル出口通過後 | 〇 |
| `c4-weather-202502270600` | 2/27の6時から13時のリクエスト向けデータ | 2/27 6時直前 | |
| `c4-weather-202502270900-tunnel` | 2/27の9時以降のトンネル侵入時のリクエスト向けデータ | 2/27 9時のリクエスト完了後 | 〇 |
| `c4-weather-202502270900-tunnel-exit` | 2/27の9時以降のトンネル出口通過後のリクエスト向けデータ | 2/27 9時以降のトンネル出口通過後 | 〇 |
| `c4-weather-202502271300-tunnel` | 2/27の13時以降のトンネル侵入時のリクエスト向けデータ | 2/27 13時のリクエスト完了後 | 〇 |
| `c4-weather-202502271300-tunnel-exit` | 2/27の13時以降のトンネル出口通過後のリクエスト向けデータ | 2/27 13時以降のトンネル出口通過後 | 〇 |
| `c4-weather-202502280600` | 2/28の6時から13時のリクエスト向けデータ | 2/28 6時直前 | |
| `c4-weather-202502280900-tunnel` | 2/28の9時以降のトンネル侵入時のリクエスト向けデータ | 2/28 9時のリクエスト完了後 | 〇 |
| `c4-weather-202502280900-tunnel-exit` | 2/28の9時以降のトンネル出口通過後のリクエスト向けデータ | 2/28 9時以降のトンネル出口通過後 | 〇 |
| `c4-weather-202502281300-tunnel` | 2/28の13時以降のトンネル侵入時のリクエスト向けデータ | 2/28 13時のリクエスト完了後 | 〇 |
| `c4-weather-202502281300-tunnel-exit` | 2/28の13時以降のトンネル出口通過後のリクエスト向けデータ | 2/28 13時以降のトンネル出口通過後 | 〇 |

#### 実証検証(物標情報ダミーデータ)

| プロファイル名              | 内容              |
|----------------------|-----------------|
| `c1-target-20250210` | 2/10のリクエスト向けデータ |
| `c1-target-20250213` | 2/13のリクエスト向けデータ |
| `c1-target-20250214` | 2/14のリクエスト向けデータ |
| `c1-target-20250215` | 2/15のリクエスト向けデータ |
| `c1-target-20250216` | 2/16のリクエスト向けデータ |
| `c1-target-20250217` | 2/17のリクエスト向けデータ |
| `c1-target-20250218` | 2/18のリクエスト向けデータ |
| `c1-target-20250219` | 2/19のリクエスト向けデータ |
| `c1-target-20250220` | 2/20のリクエスト向けデータ |
| `c1-target-20250221` | 2/21のリクエスト向けデータ |
| `c1-target-20250227` | 2/27のリクエスト向けデータ |