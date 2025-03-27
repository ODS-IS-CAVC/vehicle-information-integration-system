# 空間情報サブシステム基盤の構築資材

## 前提

* 本手順では、以下のサブシステムを構築するための手順を記載する

| サブシステム名 | サブシステム識別子 | 機能名 |
|-----|-----|-----|
| 空間情報サブシステム | space | ダイナミックマップデータベース |
| 空間情報サブシステム | space | 空間ID検索AP |
| 情報収集サブシステム | collection | 情報収集AP |
| 仮想データレイクサブシステム | vdl | 仮想データレイク |

* 構築環境は以下を想定する

| 環境名 | 環境識別子 |
|-----|-----|
| 実証環境 | poc |
| 開発環境 | dev |

* AWS IAMユーザが払い出されていること
  * IAMユーザのアクセスキー／シークレットキーを用いて、configureにプロファイル名`digiline`を設定済みであること
  ```
  $ aws configure --profile digiline 
  AWS Access Key ID [****************xxxx]: <Access Key>
  AWS Secret Access Key [****************xxxx]: <Secret Key>
  Default region name [None]: ap-northeast-1 
  Default output format [None]: json
  ```

  * CodeCommitにHTTPS接続するためのGit認証情報が作成されていること
    * 参考：https://docs.aws.amazon.com/ja_jp/codecommit/latest/userguide/setting-up-gc.html

## 構築資材

* リポジトリ
  * [com-space-infra](https://ap-northeast-1.console.aws.amazon.com/codesuite/codecommit/repositories/com-space-infra/browse?region=ap-northeast-1)

* フォルダ構成
  ```
  com-space-infra/
  ├ ansible/               # Ansible資材
  │  ├ inventory
  │  │  └ hosts            # インベントリファイル
  |  ├ roles               # 各playbookが呼び出すロール
  |  ├ dev-collection.yml  # dev環境・情報収集向けplaybook
  |  ├ dev-space.yml       # dev環境・空間ID検索向けplaybook
  |  ├ dev-vdl.yml         # dev環境・仮想データレイク向けplaybook
  |  ├ poc-collection.yml  # poc環境・情報収集向けplaybook
  |  ├ poc-space.yml       # poc環境・空間ID検索向けplaybook
  |  └ poc-vdl.yml         # poc環境・仮想データレイク向けplaybook
  └ terraform/             # Terraform資材
     ├ collection          # 情報収集向けmodule
     ├ envs
     │  ├ dev              # dev環境向けメインフォルダ
     │  └ poc              # poc環境向けメインフォルダ
     ├ space               # 空間ID検索向けmodule
     └ vdl                 # 仮想データレイク向けmodule
  ```

* Terraform資材の適用範囲
  * 全般的なAWSリソースの作成
    * Subnet、EC2、Security Group、ELB、Elasticache for Redisなど
    * EKSに関しては、eksctlコマンドで使用するyamlファイルの作成まで行う

* Ansile資材の適用範囲
  * EC2上に情報収集APおよび空間ID検索APをデプロイ
  * eksctlコマンドによるEKSリソース作成
  * EKS向けWork用EC2への環境準備およびEKS上に仮想データレイク環境の構築

## 実行手順

### Terraform実行 

#### 事前準備

* Terraformがインストール済みであること
  ```
  $ terraform version
  Terraform v1.10.5-dev
  on linux_amd64
  ```

#### AWSリソース作成

* main.tfが存在するenvs/dev（もしくはenvs/poc）ディレクトリに移動
  ```
  $ cd com-space-infra/terraform/envs/dev/
  ```

* VPCやサブネット、IPアドレス等の情報は、環境に合わせてファイルを修正
  ```
  $ vi terraform.tfvars
  ``` 

  * VPC

    |環境|VPC ID|
    |-----|-----|
    |dev|vpc-0332201122cb57bd6|
    |poc|vpc-0649599f98854db5e|
  
  * VPCエンドポイント

    |環境|用途|エンドポイント名|エンドポイントID|
    |-----|-----|-----|-----|
    |dev|Session Manager|s3|vpce-051a9a901fdcaedd3|
    |dev|Session Manager|ssm|vpce-0d0f907d17ca440d5|
    |dev|Session Manager|ssmmessages|vpce-0cfac4ea5197b6a2e|
    |dev|EKS|ecr_api|vpce-0accd7304bba81d19|
    |dev|EKS|ecr_dkr|vpce-08a51e6ca20038439|
    |poc|Session Manager|s3|vpce-06554aa54f61dff00|
    |poc|Session Manager|ssm|vpce-06513fe8fc7f10f26|
    |poc|Session Manager|ssmmessages|vpce-06cbc8aae8163bd35|
    |poc|EKS|ecr_api|vpce-0b94b64a004f6e18a|
    |poc|EKS|ecr_dkr|vpce-0e1e384f3767c4f43|

  * サブネット

    |環境|サブシステム名|Public/Private|AZ|CIDR|
    |-----|-----|-----|-----|-----|
    |dev|空間情報サブシステム|Public|A|172.16.128.0/20|
    |dev|空間情報サブシステム|private|A|172.16.144.0/20|
    |dev|空間情報サブシステム|private|C|172.16.160.0/20|
    |dev|仮想データレイクサブシステム|private|A|172.16.176.0/20|
    |dev|仮想データレイクサブシステム|private|C|172.16.192.0/20|
    |dev|情報収集サブシステム|private|A|172.16.208.0/20|
    |dev|統合情報生成サブシステム|private|A|172.16.16.0/20|
    |dev|統合情報生成サブシステム|private|C|172.16.48.0/20|
    |poc|空間情報サブシステム|Public|A|172.17.128.0/20|
    |poc|空間情報サブシステム|private|A|172.17.144.0/20|
    |poc|空間情報サブシステム|private|C|172.17.160.0/20|
    |poc|仮想データレイクサブシステム|private|A|172.17.176.0/20|
    |poc|仮想データレイクサブシステム|private|C|172.17.192.0/20|
    |poc|情報収集サブシステム|private|A|172.17.208.0/20|
    |poc|統合情報生成サブシステム|private|A|172.17.16.0/20|
    |poc|統合情報生成サブシステム|private|C|172.17.48.0/20|

  * インターネットゲートウェイ

    |環境|インターネットゲートウェイID|
    |-----|-----|
    |dev|igw-08ae11c57b715ccf2|
    |poc|igw-0d39845c6d3ed68c3|

  * EC2インスタンス
    
    |環境|EC2インスタンス名|IPアドレス|
    |-----|-----|-----|
    |dev|踏み台サーバ|172.16.144.7|
    |dev|空間ID検索AP(AZ_A)|172.16.144.10|
    |dev|空間ID検索AP(AZ_C)|172.16.160.10|
    |dev|仮想データレイクwork用サーバ|172.16.176.11|
    |dev|情報収集AP(Halex)|172.16.208.10|
    |dev|情報収集AP(Tier4)|172.16.208.20|
    |poc|踏み台サーバ|172.17.144.7|
    |poc|空間ID検索AP(AZ_A)|172.17.144.10|
    |poc|空間ID検索AP(AZ_C)|172.17.160.10|
    |poc|仮想データレイクwork用サーバ|172.17.176.11|
    |poc|情報収集AP(Halex)|172.17.208.10|
    |poc|情報収集AP(Tier4)|172.17.208.20|

* tfstateを保存するバケットや認証情報は、環境に合わせてファイルを修正
  ```
  $ vi backend.tf
  ``` 

  |環境|バケット名|
  |-----|-----|
  |dev|dev-tig-s3-terraform-state|
  |poc|poc-tig-s3-terraform-state|

* Terraform実行
  ```
  $ terraform init
  $ terraform plan
  $ terraform apply
  ```

### 作成されるAWSリソースの一覧

* ダイナミックマップデータベース_基本設計書および、仮想データレイク_基本設計書の「基盤設計」-「AWS設計内容」を参照すること

### Ansible実行

#### 事前準備

* Ansibleがインストール済みであること
  ```
  $ ansible --version
  ansible [core 2.15.3]
    config file = None
    configured module search path = ['/home/btsuzukistr/.ansible/plugins/modules', '/usr/share/ansible/plugins/modules']
    ansible python module location = /usr/lib/python3.9/site-packages/ansible
    ansible collection location = /home/btsuzukistr/.ansible/collections:/usr/share/ansible/collections
    executable location = /usr/bin/ansible
    python version = 3.9.16 (main, Jul  5 2024, 00:00:00) [GCC 11.4.1 20230605 (Red Hat 11.4.1-2)] (/usr/bin/python3.9)
    jinja version = 3.1.4
    libyaml = True
  ```

* ~/.ssh/configの作成
  * 各EC2インスタンスにSSH接続できることを確認する
  * 個別ユーザを手動で作成済みで、鍵認証によるSSH接続できることを前提にしている
  ```
  # digiline aws
  ## bastion
  Host aws-digiline-dev-space-ec2-bastion
       Hostname i-0a18abc85002d9465
       User xxxxxxxx
      IdentityFile ~/.ssh/xxxxxxxx_rsa
       ProxyCommand sh -c "/usr/bin/aws ssm start-session --target %h --document-name AWS-StartSSHSession --region ap-northeast-1 --no-verify --profile digiline"

  Host aws-digiline-poc-space-ec2-bastion
       Hostname i-090e6e6c8bcefe25e
       User xxxxxxxx
       IdentityFile ~/.ssh/xxxxxxxx_rsa
       ProxyCommand sh -c "/usr/bin/aws ssm start-session --target %h --document-name AWS-StartSSHSession --region ap-northeast-1 --no-verify --profile digiline"

  ## spatial id search
  Host aws-digiline-dev-space-ec2-azASpatialIdSearch
       Hostname 172.16.144.10
       User xxxxxxxx
       IdentityFile ~/.ssh/xxxxxxxx_rsa
       ProxyJump aws-digiline-dev-space-ec2-bastion

  Host aws-digiline-dev-space-ec2-azCSpatialIdSearch
       Hostname 172.16.160.10
       User xxxxxxxx
       IdentityFile ~/.ssh/xxxxxxxx_rsa
       ProxyJump aws-digiline-dev-space-ec2-bastion

  Host aws-digiline-poc-space-ec2-azASpatialIdSearch
       Hostname 172.17.144.10
       User xxxxxxxx
       IdentityFile ~/.ssh/xxxxxxxx_rsa
       ProxyJump aws-digiline-poc-space-ec2-bastion

  Host aws-digiline-poc-space-ec2-azCSpatialIdSearch
       Hostname 172.17.160.10
       User xxxxxxxx
       IdentityFile ~/.ssh/xxxxxxxx_rsa
       ProxyJump aws-digiline-poc-space-ec2-bastion

  ## collection
  Host aws-digiline-dev-collection-ec2-azATier4
       Hostname 172.16.208.10
       User xxxxxxxx
       IdentityFile ~/.ssh/xxxxxxxx_rsa
       ProxyJump aws-digiline-dev-space-ec2-bastion

  Host aws-digiline-dev-collection-ec2-azAHalex
       Hostname 172.16.208.20
       User xxxxxxxx
       IdentityFile ~/.ssh/xxxxxxxx_rsa
       ProxyJump aws-digiline-dev-space-ec2-bastion

  Host aws-digiline-poc-collection-ec2-azATier4
       Hostname 172.17.208.10
       User xxxxxxxx
       IdentityFile ~/.ssh/xxxxxxxx_rsa
       ProxyJump aws-digiline-poc-space-ec2-bastion

  Host aws-digiline-poc-collection-ec2-azAHalex
       Hostname 172.17.208.20
       User xxxxxxxx
       IdentityFile ~/.ssh/xxxxxxxx_rsa
       ProxyJump aws-digiline-poc-space-ec2-bastion

  ## eks work
  Host aws-digiline-dev-vdl-ec2-eks-work
       Hostname 172.16.176.10
       User xxxxxxxx
       IdentityFile ~/.ssh/xxxxxxxx_rsa
       ProxyJump aws-digiline-dev-space-ec2-bastion

  Host aws-digiline-poc-vdl-ec2-eks-work
       Hostname 172.17.176.10
       User xxxxxxxx
       IdentityFile ~/.ssh/xxxxxxxx_rsa
       ProxyJump aws-digiline-poc-space-ec2-bastion
  ```

#### 空間ID検索AP

* Ansibleディレクトリに移動
  ```
  $ cd com-space-infra/ansible/
  ```

* 環境に合わせてインベントリを修正
  ```
  $ vi inventory/hosts
  ```

  |環境|AP名|ポート番号|接続先RedisのDNS|ビットパターン|
  |----|----|----|----|----|
  |dev|search-vehicle-api|8081|clustercfg.dev-space-redis-tier4.soila4.apne1.cache.amazonaws.com:6379|tttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt<br>fxytfxyt:52:ZFXY|
  |dev|search-weather-api|8082|clustercfg.dev-space-redis-halex.soila4.apne1.cache.amazonaws.com:6379|tttttttttttttttttttttttttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:38:ZFXY|
  |poc|search-vehicle-api|8081|clustercfg.poc-space-redis-tier4.soila4.apne1.cache.amazonaws.com:6379|tttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt<br>fxytfxyt:52:ZFXY|
  |poc|search-weather-api|8082|clustercfg.poc-space-redis-halex.soila4.apne1.cache.amazonaws.com:6379|tttttttttttttttttttttttttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:38:ZFXY|

  * CodeCommitに配置されたコードを `git clone` する前提のため、実行環境に合わせて `ansible/roles` 配下のソースコードを適宜修正すること

* Ansible実行
  ```
  $ ansible-playbook -i inventory/hosts dev-space.yml
  $ ansible-playbook -i inventory/hosts poc-space.yml
  ```

#### 情報収集AP

* Ansibleディレクトリに移動
  ```
  $ cd com-space-infra/ansible/
  ```

* 環境に合わせてインベントリを修正
  ```
  $ vi inventory/hosts
  ```

  |環境|AP名|ポート番号|接続先RedisのDNS|ビットパターン|
  |----|----|----|----|----|
  |dev|weather-information-collector|8081|clustercfg.dev-space-redis-halex.soila4.apne1.cache.amazonaws.com:6379|tttttttttttttttttttttttttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:38:<br>ZFXY|
  |dev|vehicle-information-collector|8082|clustercfg.dev-space-redis-tier4.soila4.apne1.cache.amazonaws.com:6379|tttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt<br>fxytfxytfxyt:52:ZFXY|
  |dev|target-information-collector|8083|clustercfg.dev-space-redis-tier4.soila4.apne1.cache.amazonaws.com:6379|tttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt<br>fxytfxytfxyt:52:ZFXY|
  |poc|weather-information-collector|8081|clustercfg.poc-space-redis-halex.soila4.apne1.cache.amazonaws.com:6379|tttttttttttttttttttttttttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt:38:<br>ZFXY|
  |poc|vehicle-information-collector|8082|clustercfg.poc-space-redis-tier4.soila4.apne1.cache.amazonaws.com:6379|tttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt<br>fxytfxytfxyt:52:ZFXY|
  |poc|target-information-collector|8083|clustercfg.poc-space-redis-tier4.soila4.apne1.cache.amazonaws.com:6379|tttttttffxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxytfxyt<br>fxytfxytfxyt:52:ZFXY|

  * CodeCommitに配置されたコードを `git clone` する前提のため、実行環境に合わせて `ansible/roles` 配下のソースコードを適宜修正すること
  * 各種データ（車両プローブ／物標／気象）を収集するために必要な環境変数は、情報収集APのREADME.mdを確認の上、適宜変更すること

* Ansible実行
  ```
  $ ansible-playbook -i inventory/hosts dev-collection.yml
  $ ansible-playbook -i inventory/hosts poc-collection.yml
  ```

#### 仮想データレイク

* EC2インスタンス接続用のキーペア配置
  * [aws-digiline-com-keypair.pem](https://nttdatajpprod.sharepoint.com/sites/NEDO763/_layouts/15/DocIdRedir.aspx?ID=P3PKPUJ25TSK-101339327-11858)
  * ログインユーザのhomeディレクトリ配下に配置すること

* 仮想データレイク構築資材の配置
  * [vdl-2024-v1.0.1.zip](https://nttdatajpprod.sharepoint.com/sites/NEDO763/_layouts/15/DocIdRedir.aspx?ID=P3PKPUJ25TSK-101339327-11897)
  * ログインユーザのhomeディレクトリ配下に配置すること

* Ansibleディレクトリに移動
  ```
  $ cd com-space-infra/ansible/
  ```

* 環境に合わせてインベントリを修正
  ```
  $ vi inventory/hosts
  ```

  |環境|work用IPアドレス|Keycloakクライアント認証情報|Keycloakプラットフォーマー名|Keycloakユーザパスワード|
  |-----|-----|-----|-----|-----|
  |dev|172.16.176.11|<KEYCLOAK CLIENT SECRET>|<KEYCLOAK PLATFORMER USERNAME>|<KEYCLOAK USER PASSWORD>|
  |poc|172.17.176.11|<KEYCLOAK CLIENT SECRET>|<KEYCLOAK PLATFORMER USERNAME>|<KEYCLOAK USER PASSWORD>|

* Ansible実行
  ```
  $ ansible-playbook -i inventory/hosts poc-vdl.yml
  ```