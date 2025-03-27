import json
import subprocess
import psycopg2
from psycopg2.extras import DictCursor
import sys
import os
import boto3
from botocore.exceptions import ClientError
import zipfile
import datetime

FILE_STATUS_WAIT = 1
FILE_STATUS_CREATING = 2
FILE_STATUS_CREATED = 3
FILE_STATUS_ERROR = 99

# secretsmanagerから値を取得
def get_secret(secret_name, region_name="ap-northeast-1"):
    # Create a Secrets Manager client
    client = boto3.client('secretsmanager', region_name=region_name)

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name)
    except ClientError as e:
        if e.response['Error']['Code'] == 'DecryptionFailureException':
            raise e
        elif e.response['Error']['Code'] == 'InternalServiceErrorException':
            raise e
        elif e.response['Error']['Code'] == 'InvalidParameterException':
            raise e
        elif e.response['Error']['Code'] == 'InvalidRequestException':
            raise e
        elif e.response['Error']['Code'] == 'ResourceNotFoundException':
            raise e
    else:
        # Decrypts secret using the associated KMS CMK.
        secret = get_secret_value_response['SecretString']

    return json.loads(secret)

# ファイル作成状況の更新
def update_file_status(connection, request_id, file_status):
    try:
        # カーソルオブジェクトを作成する
        cursor = connection.cursor(cursor_factory=DictCursor)
        # UPDATE文の作成
        update_query = """
        UPDATE
            share.point_cloud_split_manage
        SET
            file_status = {}
        WHERE
            id = {}
        """.format(file_status, request_id)
        cursor.execute(update_query)
        connection.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"ファイル作成状況の更新に失敗: {error}")
        raise error

# 作成した分割後の点群データの状況を更新
def update_zip_path(connection, request_id, file_status, bucket_name, key_path):
    try:
        # カーソルオブジェクトを作成する
        cursor = connection.cursor(cursor_factory=DictCursor)
        # UPDATE文の作成
        update_query = """
        UPDATE
            share.point_cloud_split_manage
        SET
            s3_bucket = '{}',
            s3_key = '{}',
            filename = '{}',
            file_status = {}
        WHERE
            id = {}
        """.format(bucket_name, key_path, os.path.basename(key_path), file_status , request_id)
        cursor.execute(update_query)
        connection.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"ZIPファイル情報の更新に失敗: {error}")
        raise error

def handler(event, context):
    try:
        # 接続情報をAWSのsecretsmanagerから取得
        secret_name = "rds-db-credentials/cluster-XXSHMKZVQTF2KHDSXN5CU2BJDI/postgres/1731562394872"
        region_name = "ap-northeast-1"
        secret = get_secret(secret_name, region_name)
        db_host = secret.get("proxyhost", "")
        db_name = 'DMDB'
        db_user = secret.get("username", "")
        db_pass = secret.get("password", "")
        db_port = secret.get("port", "")

        try:
            # データベースに接続する
            connection = psycopg2.connect(
                user=db_user,
                password=db_pass,
                host=db_host,
                database=db_name,
                port=db_port
            )
        except:
            print(f"DBの接続に失敗したので処理を終了します。")
            return {
                'statusCode': 500,
                'body': json.dumps('DBの接続に失敗したので処理を終了します。')
            }

        # カーソルオブジェクトを作成する
        cursor = connection.cursor(cursor_factory=DictCursor)

        # 分割申請テーブルから未処理の点群データ分割申請を取得(1件のみ)
        select_query = """
        SELECT
            pcsm.start_lat,
            pcsm.start_lon,
            pcsm.end_lat,
            pcsm.end_lon,
            li.key_path,
            pcsm.id
        FROM 
            share.point_cloud_split_manage AS pcsm
        INNER JOIN
            assets.lidar AS li on pcsm.point_cloud_unique_id = li.id
        WHERE
            pcsm.file_status = {}
        ORDER BY
            pcsm.created_at ASC
        LIMIT 1
        """.format(FILE_STATUS_WAIT)

        cursor.execute(select_query)
        record = cursor.fetchone()
        # 取得結果が無い場合、処理を終了
        if not (record):
            print("作成待ちの申請が無かったため、処理を終了しました。")
            return {
                'statusCode': 200,
                'body': json.dumps('作成待ちの申請が無かったため、処理を終了しました。')
            }

        # 必要な情報を整備
        start_lat, start_lon, end_lat, end_lon = record[0], record[1], record[2], record[3]
        # 始点と終点の座標情報を始点 < 終点になるように調整
        if record[0] > record[2]:
            start_lat = record[2]
            end_lat = record[0]
        if record[1] > record[3]:
            start_lon = record[3]
            end_lon = record[1]

        s3_bucket_key_path = record[4].split("/")
        s3_bucket = s3_bucket_key_path.pop(0)
        s3_key_path = '/'.join(s3_bucket_key_path)
        request_id = record[5]
        print(f"ダウンロード対象のバケット名： {s3_bucket}")
        print(f"ダウンロード対象のキーパス： {s3_key_path}")
        
        # ファイル作成状況を作成中に更新
        update_file_status(connection, request_id, FILE_STATUS_CREATING)

        # ダウンロード先ディレクトリを設定
        download_path = '/tmp/' + "requestId_" + str(request_id) + '/'
        output_file = '/tmp/' + "requestId_" + \
            str(request_id) + '/requestId_' + str(request_id) + '_split.laz'
        zip_file_path = '/tmp/' + "requestId_" + \
            str(request_id) + '/requestId_' + str(request_id) + '_split.zip'

        # 点群データをダウンロードする
        # S3クライアントの初期化
        s3 = boto3.client('s3')

        try:
            # ダウンロードディレクトリの作成
            if not os.path.exists(download_path):
                os.makedirs(download_path)
                print(f"ダウンロードディレクトリ {download_path} を作成しました。")

            # ファイルのダウンロード
            s3.download_file(s3_bucket, s3_key_path, os.path.join(
                download_path, os.path.basename(s3_key_path)))
            print(f"ファイル {s3_key_path} をダウンロードしました。")
            print(os.path.join(download_path, os.path.basename(s3_key_path)))

        except Exception as error:
            print(f"ファイルのダウンロード中にエラーが発生しました: {str(error)}")
            raise error
        target_file = os.path.join(
            download_path, os.path.basename(s3_key_path))
        print(f"PDAL対象の点群データ: {target_file}")
        print(f"PDAL infoコマンド実行")
        # PDALコマンドで点群の統計情報取得
        command = f"pdal info --metadata {target_file}"

        ret = subprocess.run(command, shell=True,
                             capture_output=True, text=True)
        
        print(f"PDAL infoコマンド成功")

        data = json.loads(ret.stdout)

        minLon = data["metadata"]['minx']
        minLat = data["metadata"]['miny']
        maxLon = data["metadata"]['maxx']
        maxLat = data["metadata"]['maxy']

        print(f"各種座標情報(start_lat): {start_lat}")
        print(f"各種座標情報(end_lat): {end_lat}")
        print(f"各種座標情報(start_lon): {start_lon}")
        print(f"各種座標情報(end_lon): {end_lon}")
        
        print(f"各種座標情報(minLon): {minLon}")
        print(f"各種座標情報(minLat): {minLat}")
        print(f"各種座標情報(maxLon): {maxLon}")
        print(f"各種座標情報(maxLat): {maxLat}")

        # minLat, maxLat, minLon, maxLon = 10, 20, 10, 20
        # 範囲チェック
        errorCount = 0
        # 始点のチェック
        if ((minLat <= start_lat <= maxLat) and (minLon <= start_lon <= maxLon)) == False:
            errorCount = errorCount + 1
        # 終点のチェック
        if ((minLat <= end_lat <= maxLat) and (minLon <= end_lon <= maxLon)) == False:
            errorCount = errorCount + 1
        # 始点と終点が共に範囲外の場合、エラーで処理を終了する。
        if errorCount == 2:
            print("分割指定が点群データの範囲外のため処理を終了します。")
            raise Exception
        # 座標分割設定
        data = {
            "pipeline": [
                {
                    "type": "readers.las",
                    "filename": target_file,
                },
                {
                    "type": "filters.crop",
                    "polygon": "Polygon (({0} {1}, {0} {3}, {2} {3}, {2} {1}, {0} {1}))".format(start_lon, start_lat, end_lon, end_lat),
                    "outside": "false"
                },
                {
                    "type": "writers.las",
                    "scale_x": "0.0000001",
                    "scale_y": "0.0000001",
                    "scale_z": "0.01",
                    "offset_x": "auto",
                    "offset_y": "auto",
                    "offset_z": "auto",
                    "filename": output_file,
                }
            ]
        }
        # 分割設定用のJSONを保存
        pipelineJson = "/tmp/" + str(request_id) + ".json"
        with open(pipelineJson, 'w') as f:
            json.dump(data, f, indent=2)

        # 座標分割実行
        command = "pdal pipeline " + pipelineJson

        print(f"分割処理実行前")
        print(f"command: {command}")
        print(f"recoveryFuncId={request_id}")
        ret = subprocess.run(command, shell=True,capture_output=True, text=True)
        print(f"分割処理実行完了")

        # 分割処理の成功時のファイルチェック
        if not os.path.exists(output_file):
            print("分割処理後の点群データが存在しないため、処理を終了します。")
            raise Exception

        # zip圧縮
        with zipfile.ZipFile(zip_file_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
            z.write(output_file)

        # zipをS3にアップロード
        try:
            time_delta = datetime.timedelta(hours=9)
            JST = datetime.timezone(time_delta, 'JST')
            now = datetime.datetime.now(JST)
            # S3バケット名とアップロードするファイルの名前を定義
            zip_upload_bucket_name = 'stg-c2-up-va755b5jei6i'
            point_cloud_upload_path = 'point-cloud/splited/request_{}/{}_split.zip'.format(
                request_id,  now.strftime('%Y%m%d%H%M%S'))
            # S3にファイルをアップロード
            s3.upload_file(zip_file_path, zip_upload_bucket_name, point_cloud_upload_path)
        except Exception as error:
            print(f"S3へのファイルのアップロード中にエラーが発生しました: {str(error)}")
            raise error
        
        # DBのファイル作成状況とパス情報を更新
        update_zip_path(connection, request_id, FILE_STATUS_CREATED, zip_upload_bucket_name, point_cloud_upload_path)
        
        return {
            'statusCode': 200,
            'body': json.dumps('点群データの分割処理が成功しました。')
        }

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"エラーが発生しました: {error}")
        update_file_status(connection, request_id, FILE_STATUS_ERROR)

    finally:
        # カーソルと接続を閉じる
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            print("PostgreSQLの接続が閉じられました。")

