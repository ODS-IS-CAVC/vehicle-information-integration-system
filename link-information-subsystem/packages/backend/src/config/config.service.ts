import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { Injectable } from "@nestjs/common";
import { AWS_REGION, AWS_SECRET_NAME } from "src/consts/aws.const";

@Injectable()
export class ConfigService {
  async databaseConfig() {
    const secrets: any = await this.getSecretValue(AWS_SECRET_NAME());
    return {
      type: "postgres",
      host: secrets.proxyhost,
      port: parseInt(secrets.port),
      database: "DMDB",
      username: secrets.username,
      password: secrets.password,
      autoLoadEntities: true,
      logging: true,
    };
  }
  async getSecretValue(secretName: string): Promise<string | undefined> {
    try {
      // AWSのアクセス情報を読み込み
      const credentialProvider = fromNodeProviderChain();
      // SecretsManagerClientの作成
      const client = new SecretsManagerClient({ credentials: credentialProvider, region: AWS_REGION });
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await client.send(command);

      // シークレットの値を返す
      if (response.SecretString) {
        return JSON.parse(response.SecretString);
      } else {
        console.error("SecretBinary is not supported in this example");
        return undefined;
      }
    } catch (error) {
      console.error("Error retrieving secret value:", error);
      return undefined;
    }
  }
}
