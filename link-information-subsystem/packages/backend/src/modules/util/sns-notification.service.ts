import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SnsErrorCount } from "src/entities/share/sns-error-counts";
import { PublishCommand, PublishCommandOutput, SNSClient } from "@aws-sdk/client-sns";
import { AWS_REGION } from "src/consts/aws.const";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { LoggerService } from "./logger/logger.service";

@Injectable()
export class SnsNotificationService {
  constructor(
    @InjectRepository(SnsErrorCount)
    private readonly snsErrorCountRepository: Repository<SnsErrorCount>,
    private readonly loggerService: LoggerService,
  ) {}

  // メッセージのテンプレート
  private messageTemplate = [
    {
      type: "a",
      content: `【重大なエラー】\n
        {apiName}で{count}件の同様のエラーが発生しました。\n
        至急確認してください。\n
        {errorContent}`,
    },
    {
      type: "b",
      content: `【警告】\n
        {apiName}で{count}件の同様のエラーが発生しました。\n
        何度も続く場合は確認してください。\n
        {errorContent}`,
    },
  ];

  /**
   * メッセージを受け取りSNS通知する
   * @param message
   * @returns
   */
  private async publish(message: string) {
    // AWSのアクセス情報を読み込み
    const credentialProvider = fromNodeProviderChain();
    const snsClient = new SNSClient({
      region: AWS_REGION,
      credentials: credentialProvider,
    });
    // SNSへ送信
    const response = await snsClient.send(
      new PublishCommand({
        Message: message,
        TopicArn: process.env.AWS_SNS_TOPIC_ARN,
      }),
    );
    return response;
  }

  /**
   * テンプレートにエラーメッセージをセットする
   * @param type
   * @param content
   * @returns
   */
  private setMessage(type: string, content: string, count: number, apiName: string): string {
    const template = this.messageTemplate.filter((temp) => temp.type == type)[0];
    const message = template.content.replace("{apiName}", apiName).replace("{count}", count.toString()).replace("{errorContent}", content);
    return message;
  }

  /**
   * エラーの回数をカウントし、閾値を超えるとSNSで通知を行う
   * @param apiName
   * @param content
   * @returns
   */
  async notifyError(apiName: string, content: string): Promise<boolean> {
    try {
      // エラー内容と閾値のデータを取得
      const snsCount: SnsErrorCount = await this.snsErrorCountRepository.findOneBy({
        content: content,
      });
      if (snsCount == null) {
        throw new NotFoundException();
      }

      // カウントアップして閾値チェック
      let updatedSnsCount = {
        ...snsCount,
        count: snsCount.count + 1,
      };
      // 閾値を超えていればSNSに通知
      if (updatedSnsCount.count >= snsCount.threshold) {
        const message = this.setMessage(snsCount.type, content, updatedSnsCount.count, apiName);
        const res: PublishCommandOutput = await this.publish(message);
        if (res.$metadata.httpStatusCode == 200) {
          // 通知成功時にカウントを0にしてDB更新
          updatedSnsCount = {
            ...snsCount,
            count: 0, // 通知後はカウントを0にする
          };
          await this.snsErrorCountRepository.save(updatedSnsCount);
        } else {
          // 通知失敗時はカウントアップした値でDB更新
          await this.snsErrorCountRepository.save(updatedSnsCount);
          throw new InternalServerErrorException();
        }
      } else {
        // 閾値を超えていない場合はカウントアップした値でDB更新
        await this.snsErrorCountRepository.save(updatedSnsCount);
      }
      return true;
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
}
