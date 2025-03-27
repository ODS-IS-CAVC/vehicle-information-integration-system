import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "./config.service";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

jest.mock("@aws-sdk/client-secrets-manager", () => {
  return {
    GetSecretValueCommand: jest.fn(),
    SecretsManagerClient: jest.fn(),
  };
});

describe("ConfigService", () => {
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("databaseConfig", () => {
    it("データベースの構成を正しく返すこと", async () => {
      const mockSecretValue: any = {
        proxyhost: "mockhost",
        port: "5432",
        username: "mockuser",
        password: "mockpassword",
      };

      // getSecretValueメソッドをモック化
      jest.spyOn(service, "getSecretValue").mockReturnValue(mockSecretValue);

      const config = await service.databaseConfig();

      expect(config).toEqual({
        type: "postgres",
        host: "mockhost",
        port: 5432,
        database: "DMDB",
        username: "mockuser",
        password: "mockpassword",
        autoLoadEntities: true,
        logging: true,
      });
    });
  });

  describe("getSecretValue", () => {
    const secretName = "rds-db-credentials/cluster-HFA7PAMYM7MWMGBM5LOCMDBL7A/postgres/1727759994308";
    let sendMock: jest.Mock;
    let spyConsoleError: jest.SpyInstance;

    it("シークレットの値を正しく取得すること", async () => {
      const mockSecretValue = '{"proxyhost":"mockhost","port":"5432","username":"mockuser","password":"mockpassword"}';
      sendMock = jest.fn().mockResolvedValue({ SecretString: mockSecretValue });
      SecretsManagerClient.prototype.send = sendMock;

      const result = await service.getSecretValue(secretName);

      // アサーションの呼び出し確認
      expect.assertions(2);

      expect(sendMock).toHaveBeenCalledWith(new GetSecretValueCommand({ SecretId: secretName }));
      expect(result).toEqual(JSON.parse(mockSecretValue));
    });

    it("SecretString が存在しない場合、undefinedを返すこと", async () => {
      sendMock = jest.fn().mockResolvedValue({});
      SecretsManagerClient.prototype.send = sendMock;

      spyConsoleError = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await service.getSecretValue(secretName);

      // アサーションの呼び出し確認
      expect.assertions(3);

      expect(sendMock).toHaveBeenCalledWith(new GetSecretValueCommand({ SecretId: secretName }));
      expect(result).toBeUndefined();
      expect(spyConsoleError).toHaveBeenCalledWith("SecretBinary is not supported in this example");
    });

    it("エラーが発生した場合、undefinedを返すこと", async () => {
      sendMock = jest.fn().mockRejectedValue(new Error("Some error"));
      SecretsManagerClient.prototype.send = sendMock;

      spyConsoleError = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await service.getSecretValue(secretName);

      // アサーションの呼び出し確認
      expect.assertions(3);

      expect(sendMock).toHaveBeenCalledWith(new GetSecretValueCommand({ SecretId: secretName }));
      expect(result).toBeUndefined();
      expect(spyConsoleError).toHaveBeenCalledWith("Error retrieving secret value:", expect.any(Error));
    });
  });
});
