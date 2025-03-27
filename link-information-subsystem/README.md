## 車両情報連携システム（リンク情報サブシステム）

## 概要

車両情報連携システム（リンク情報サブシステム）は、以下の機能（API）を提供します。
OpenAPI仕様はサブフォルダ [OpenAPI](openapi) にあります。

- HD地図データ取得API
- ファイル属性取得API
- 工事行事予定情報取得API
- 旅行時間情報データ取得API
- 交通渋滞・規制情報データ取得API
- 冬季閉鎖情報取得API
- 入口出口閉鎖情報取得API
- 点群データファイル取得API
- 気象リスク情報取得API
- 認証トークン取得API
- 汎用アクセスURL取得API
- 共有資源状態API
- 座標変換API

## 各コンテナについて

各コンテナの定義は`docker/`配下で定義しています。

#### [PostgreSQL(PostGIS)](https://hub.docker.com/_/postgres)

データベース用のコンテナです。

#### App

開発用のコンテナです。

## パッケージについて

#### backend

```bash
cd packages/backend/

# migration作成
npm run typeorm:migrate migrations/init

# migration適用
npm run typeorm:run

# 開発サーバー起動
npm run start

# ビルド
npm run build

# ビルド(サーバーレス向け)
npm run build:webpack
```

- API: http://localhost:3010/path/to/endpoint
- Swagger UI: http://localhost:3010/openapi
- OpenAPI(json): http://localhost:3010/api-json
- OpenAPI(yaml): http://localhost:3010/api-yaml

## サンプル・データベース

- ダイナミックマップのサンプル・データベース・スキーマ[(sample-dynamic-map-database.pgdump)](sample-dynamic-map-database.pgdump) が同梱されています。

## 注意事項

- Google Chrome の最新版（Chrome 133.0.0.0）で動作を確認しています。
- プロジェクトの特性に合わせて自由に拡張してください。

## 問合せ及び要望に関して

- 本リポジトリは現状は主に配布目的の運用となるため、IssueやPull Requestに関しては受け付けておりません。

## ライセンス

- 本リポジトリはMITライセンスで提供されています。
- ソースコードおよび関連ドキュメントの著作権はダイナミックマッププラットフォーム株式会社に帰属します。

## 免責事項

- 本リポジトリの内容は予告なく変更・削除する可能性があります。
- 本リポジトリの利用により生じた損失及び損害等について、いかなる責任も負わないものとします。
