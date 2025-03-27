import { Test, TestingModule } from "@nestjs/testing";
import { S3Service } from "../s3.service";
import { Readable } from "stream";

jest.mock("@aws-sdk/s3-request-presigner");
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

jest.mock("@aws-sdk/client-s3", () => {
  const mockS3Client = {
    send: jest.fn((command) => {
      if (command instanceof PutObjectCommand) {
        return Promise.resolve(putObjectRes);
      } else if (command instanceof GetObjectCommand) {
        return getObjectRes;
      } else if (command instanceof DeleteObjectCommand) {
        return Promise.resolve(deleteObjectRes);
      } else if (command instanceof ListObjectsV2Command) {
        return Promise.resolve(listObjectRes);
      }
    }),
  };
  return {
    S3Client: jest.fn(() => mockS3Client),
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    ListObjectsV2Command: jest.fn(),
  };
});
import {
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  PutObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { AWS_REGION } from "src/consts/aws.const";

describe("S3Service", () => {
  let s3Service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service],
    }).compile();

    s3Service = module.get<S3Service>(S3Service);
  });

  it("should be defined", () => {
    expect(s3Service).toBeDefined();
  });

  const bucket = "testbucket";
  const key = "testkey";
  const signedUrl = `https://${bucket}.s3.${AWS_REGION}.amazonaws.com/${key}?X-Amz-Credential=testtesttest...`;

  const getSignedUrlMock: jest.Mock = getSignedUrl as any;

  describe("createPresignedUrlWithClient", () => {
    it("署名付きダウンロードURLを取得する", async () => {
      getSignedUrlMock.mockResolvedValue(signedUrl);
      const result = await s3Service.createPresignedUrlWithClient(bucket, key);
      expect(result).toBe(signedUrl);
    });
  });

  describe("s3Upload", () => {
    it("ファイルを指定した名前でS3にアップロードする", async () => {
      const file: Express.Multer.File = {
        buffer: Buffer.from("test content"),
        originalname: key,
        mimetype: "text/plain",
        size: 1024,
        fieldname: "",
        encoding: "",
        stream: new Readable(),
        destination: "",
        filename: "",
        path: "",
      };
      const result: PutObjectCommandOutput = await s3Service.s3Upload(bucket, key, file);
      expect(result).toBe(putObjectRes);
    });
  });

  describe("s3Delete", () => {
    it("S3上の指定したファイルを削除する", async () => {
      const result = await s3Service.s3Delete(bucket, key);
      expect(result).toBe(deleteObjectRes);
    });
  });

  describe("getS3FileAttributes", () => {
    it("S3上の指定したファイルの属性情報を取得する", async () => {
      const result = await s3Service.getS3FileAttributes(bucket, key);
      expect(result).toBe(listObjectRes);
    });
  });

  describe("uploadPresignedUrlWithClient", () => {
    it("S3にファイルをアップロードするための署名付きURL情報を取得する", async () => {
      getSignedUrlMock.mockResolvedValue(signedUrl);
      const result = await s3Service.uploadPresignedUrlWithClient(bucket, key);
      expect(result).toBe(signedUrl);
    });
  });
});

// s3のmock設定
const putObjectRes: PutObjectCommandOutput = {
  ETag: '"testEtag12345678"',
  VersionId: "AbCdEf_ghiJkLm",
  Expiration: "STRING_VALUE",
  ChecksumCRC32: "STRING_VALUE",
  ChecksumCRC32C: "STRING_VALUE",
  ChecksumSHA1: "STRING_VALUE",
  ChecksumSHA256: "STRING_VALUE",
  ServerSideEncryption: "AES256",
  SSECustomerAlgorithm: "STRING_VALUE",
  SSECustomerKeyMD5: "STRING_VALUE",
  SSEKMSKeyId: "STRING_VALUE",
  SSEKMSEncryptionContext: "STRING_VALUE",
  BucketKeyEnabled: true || false,
  RequestCharged: "requester",
  $metadata: undefined,
};

const getObjectRes: GetObjectCommandOutput = {
  DeleteMarker: true || false,
  AcceptRanges: "STRING_VALUE",
  Expiration: "STRING_VALUE",
  Restore: "STRING_VALUE",
  LastModified: new Date("TIMESTAMP"),
  ContentLength: Number("long"),
  ETag: "STRING_VALUE",
  ChecksumCRC32: "STRING_VALUE",
  ChecksumCRC32C: "STRING_VALUE",
  ChecksumSHA1: "STRING_VALUE",
  ChecksumSHA256: "STRING_VALUE",
  MissingMeta: Number("int"),
  VersionId: "STRING_VALUE",
  CacheControl: "STRING_VALUE",
  ContentDisposition: "STRING_VALUE",
  ContentEncoding: "STRING_VALUE",
  ContentLanguage: "STRING_VALUE",
  ContentRange: "STRING_VALUE",
  ContentType: "STRING_VALUE",
  Expires: new Date("TIMESTAMP"),
  ExpiresString: "STRING_VALUE",
  WebsiteRedirectLocation: "STRING_VALUE",
  ServerSideEncryption: "AES256",
  Metadata: {
    "<keys>": "STRING_VALUE",
  },
  SSECustomerAlgorithm: "STRING_VALUE",
  SSECustomerKeyMD5: "STRING_VALUE",
  SSEKMSKeyId: "STRING_VALUE",
  BucketKeyEnabled: true,
  StorageClass: "STANDARD",
  RequestCharged: "requester",
  ReplicationStatus: "COMPLETE",
  PartsCount: Number("int"),
  TagCount: Number("int"),
  ObjectLockMode: "GOVERNANCE",
  ObjectLockRetainUntilDate: new Date("TIMESTAMP"),
  ObjectLockLegalHoldStatus: "ON",
  $metadata: undefined,
};

const deleteObjectRes: DeleteObjectCommandOutput = {
  DeleteMarker: true || false,
  VersionId: "STRING_VALUE",
  RequestCharged: "requester",
  $metadata: undefined,
};

const listObjectRes: ListObjectsV2CommandOutput = {
  $metadata: undefined,
};
