import json
import psycopg2
from psycopg2.extras import DictCursor
import boto3

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
    result = "ERROR"
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
                    'result': result
                    }

        cursor = connection.cursor(cursor_factory=DictCursor)

        query = (
            'DELETE FROM share.shared_resources '
            'WHERE "valid_to" < NOW();'
        )
        cursor.execute(query)
        connection.commit()
        result = "SUCCESS"

    except Exception as e:
        if connection:
            connection.rollback()
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            print("PostgreSQLの接続が閉じられました。")
        return {
            'result': result
        }