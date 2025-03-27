import { Injectable } from "@nestjs/common";
import { GetObjectCommand, S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { AWS_REGION, AWS_S3_DL_EXPIRE_IN } from "src/consts/aws.const";
import { Express } from "express";
/* eslint-disable unused-imports/no-unused-imports */
import { Multer } from "multer";
/* eslint-disable unused-imports/no-unused-imports */

@Injectable()
export class S3Service {
  constructor() {}
  /**
   * S3のファイルをダウンロードするためのURL情報を取得する
   * @param bucket バケット名
   * @param key ファイルパス
   * @returns 署名付きダウンロードURL
   */
  createPresignedUrlWithClient(bucket, key) {
    // AWSのアクセス情報を読み込み
    const credentialProvider = fromNodeProviderChain();
    // S3のアクセス情報作成
    const client = new S3Client({ credentials: credentialProvider, region: AWS_REGION });
    // S3のバケットとファイルの指定
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    // 署名付きダウンロードURLを作成
    return getSignedUrl(client, command, { expiresIn: AWS_S3_DL_EXPIRE_IN });
  }
  /**
   * S3にファイルをアップロードする
   * @param bucket バケット名
   * @param key  パス情報
   * @param file ファイル本体(binary)
   * @returns 登録結果
   */
  async s3Upload(bucket, key, file: Express.Multer.File) {
    // AWSのアクセス情報を読み込み
    const credentialProvider = fromNodeProviderChain();
    // S3のアクセス情報作成
    const client = new S3Client({ credentials: credentialProvider, region: AWS_REGION });
    // アップロード用の情報を作成
    const bucketParams = {
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
    };
    // PutObjectCommandを用いてアップロード
    const command = new PutObjectCommand(bucketParams);
    // アップロード結果の受け取り
    const result = await client.send(command);
    return result;
  }
  /**
   * S3のファイルを削除する
   * @param bucket バケット名
   * @param key パス情報
   * @returns 登録結果
   */
  async s3Delete(bucket, key) {
    // AWSのアクセス情報を読み込み
    const credentialProvider = fromNodeProviderChain();
    // S3のアクセス情報作成
    const client = new S3Client({ credentials: credentialProvider, region: AWS_REGION });
    // アップロード用の情報を作成
    const bucketParams = {
      Bucket: bucket,
      Key: key,
    };
    // DeleteObjectCommandを用いて削除
    const command = new DeleteObjectCommand(bucketParams);
    // 削除結果の受け取り
    const result = await client.send(command);
    return result;
  }
  /**
   * S3のファイル属性情報を取得する
   * @param bucket バケット名
   * @param key ファイル名
   * @returns ファイル属性情報
   */
  async getS3FileAttributes(bucket, key) {
    // AWSのアクセス情報を読み込み
    const credentialProvider = fromNodeProviderChain();
    // S3のアクセス情報作成
    const client = new S3Client({ credentials: credentialProvider, region: AWS_REGION });
    // S3のバケットとファイルの指定
    const command = new ListObjectsV2Command({ Bucket: bucket, Prefix: key });
    const result = await client.send(command);
    return result;
  }
  /**
   * S3にファイルをアップロードするためのURL情報を取得する
   * @param bucket バケット名
   * @param key ファイルパス
   * @returns 署名付きダウンロードURL
   */
  uploadPresignedUrlWithClient(bucket, key) {
    // AWSのアクセス情報を読み込み
    const credentialProvider = fromNodeProviderChain();
    // S3のアクセス情報作成
    const client = new S3Client({
      credentials: credentialProvider,
      region: AWS_REGION,
    });
    // S3のバケットとファイルの指定
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: "application/octet-stream",
    });
    // 署名付きダウンロードURLを作成
    return getSignedUrl(client, command, { expiresIn: AWS_S3_DL_EXPIRE_IN });
  }
}
