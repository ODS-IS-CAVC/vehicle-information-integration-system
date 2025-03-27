# spatial-time-id

## 概要
- 本ライブラリは<a href="https://github.com/ouranos-gex/ouranos-gex-lib-for-Python" target="_blank">ウラノスGEX 4次元時空間情報基盤用 共通ライブラリ(Python版)</a>を元に、空間IDの仕様を元に時間概念を取り扱う時空間IDを生成することができるように拡張を行ったAPIライブラリです。
- 任意の座標を空間ID及び時空間IDに変換する機能を実装しています。
- 空間ID仕様については以下のリンクを参照して下さい。
<!--[Digital Architecture Design Center 4次元時空間情報基盤 ガイドライン](https://www.ipa.go.jp/digital/architecture/project/autonomousmobilerobot/3dspatial_guideline.html)-->
<p><a href="https://www.ipa.go.jp/digital/architecture/project/autonomousmobilerobot/3dspatial_guideline.html" target="_blank">Digital Architecture Design Center 4次元時空間情報基盤アーキテクチャガイドライン（β版）</a></p>

- 時間を含めた時空間ID仕様については以下のリンクを参照して下さい。
<p><a href="https://www.ipa.go.jp/digital/architecture/Individual-link/sbn8o10000004do3-att/4dspatio-temporal-guideline-spatial-id-extended-alpha.pdf" target="_blank">4次元時空間情報基盤アーキテクチャガイドライン空間ID 拡張仕様（α版）</a></p>

- 本ライブラリで提供されるAPIの仕様については、OpenAPI Specificationのjsonファイルを参照してください。

## Web API利用方法
1. appフォルダに移動します。
```
cd ./app/
```
2. dockerコマンドでアプリケーションをビルドします。
```
docker build -f Dockerfile -t {your_tag_name} .
```
※dockerがインストールされている環境での実行をお願いします。

3. dockerコマンドでアプリケーションを稼働します。
```
docker run --name {your_conteiner_name}} --rm -p 8081:8080 {your_tag_name}
```
## テストコード利用方法(Postmanを利用)
1. testフォルダに移動します。
```
cd ./test/
```
2. <a href="https://learning.postman.com/docs/collections/using-newman-cli/installing-running-newman/" target="_blank">newman</a>コマンドでtestを実行します。
```
newman run spatialid.postman_collection.json -g config.postman_environment.json
```




## 前提ソフトウェア
#### requirements.txtを参照
- Python
  - バージョン:&gt;3.12
  - 確認日:2025/03/03
- 依存ライブラリ
    - fastapi
        - バージョン:0.115.4
        - 確認日:2025/03/03
        - 用途:Web APIフレームワーク
    - gunicorn
        - バージョン:23.0.0
        - 確認日:2025/03/03
        - 用途:WSGI（Web Server Gateway Interface）サーバー
    - uvicorn
        - バージョン:0.32.0
        - 確認日:2025/03/03
        - 用途:ASGI（Asynchronous Server Gateway Interface）サーバー
    - pydantic
        - バージョン:2.9.2
        - 確認日:2025/03/03
        - 用途:APIの入出力のデータ桁型の検証に利用
    - python-multipart
        - バージョン:0.0.17
        - 確認日:2025/03/03
        - 用途:APIのリクエストデータの検証に利用
    - pydantic_core
        - バージョン:2.23.4
        - 確認日:2025/03/03
        - 用途:pydanticの実行エンジンとして利用
    - newman
        - バージョン:6.2.1
        - 確認日:2025/03/03
        - 用途:postmanテストコード実行用ツールとして利用





## 注意事項
* ライブラリの入力可能な緯度の最大、最小値は「±85.0511287797」とします。
* ライブラリの入力可能な経度の最大、最小値は「±180.0」とします。
* 座標参照系（Coordinate reference system, CRS）はパラメータで設定が可能ですがデフォルト値は4326とします。
* zoom levelの精度レベルの指定範囲は、0から25とします。
* 空間ボクセルを生成する高さ方向の精度レベルの指定範囲は、0から25とします。
* 経度の限界値は±180ですが、180と-180は同じ個所を指すこととZFXY形式のインデックスの考え方により、180はライブラリ内部では-180として扱われます。(180の入力は可能とします。)