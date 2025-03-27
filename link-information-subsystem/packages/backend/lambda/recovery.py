import json
import base64
import gzip
import boto3
import re
import psycopg2
from psycopg2.extras import DictCursor
from botocore.exceptions import ClientError

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

def lambda_handler(event, context):
    payload = base64.b64decode(event['awslogs']['data'])
    log = json.loads(gzip.decompress(payload).decode('utf-8'))
    
    # requestID を取得 (UUID の正規表現にマッチした文字列を取得)
    reg = r'[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
    match = re.search(reg, log['logEvents'][0]['message'])
    if match:
        requestID = match.group(0)
        print(requestID)
    else:
        print('requestID が正常に取得できませんでした。')
        return
    
    # requestID と key: でフィルタし、対象メッセージを取得する。
    client = boto3.client('logs')
    
    logMsg = client.filter_log_events(
        logGroupName=log['logGroup'],
        logStreamNames=[log['logStream']],
        filterPattern="recoveryFuncId="
    )
    print(log)
    print(log['logGroup'])
    print([log['logStream']])
    print(logMsg)
    msgs = logMsg.get('events', [{'message' : ''}])[0]['message'].split(':')
    print(msgs)
    if not len(msgs) == 1 : 
        print('key が正常に取得できませんでした。')
        return
    
    value = msgs[0]
    id = value.split("=")[1]
    print(f"タイムアウトした点群分割申請のID: {id}")

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

        # データベースに接続する
        connection = psycopg2.connect(
            user=db_user,
            password=db_pass,
            host=db_host,
            database=db_name,
            port=db_port
        )

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
        """.format(FILE_STATUS_ERROR, id)
        cursor.execute(update_query)
        connection.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"エラーが発生しました: {error}")
    finally:
        # カーソルと接続を閉じる
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            print("PostgreSQLの接続が閉じられました。")
    print("点群分割処理がタイムアウトしたのでステータスを作成失敗に更新")
    return {
        'statusCode': 200,
        'body': "点群分割処理がタイムアウトしたのでステータスを作成失敗に更新"
    }
