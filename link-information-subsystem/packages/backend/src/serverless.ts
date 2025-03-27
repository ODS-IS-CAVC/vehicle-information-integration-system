import { NestFactory } from "@nestjs/core";
import serverlessExpress from "@codegenie/serverless-express";
import { AppModule } from "./app.module";
import { Callback, Context, Handler } from "aws-lambda";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Logger } from "nestjs-pino";
import * as bodyParser from "body-parser";

let server: Handler;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
  });

  app.useLogger(app.get(Logger));
  app.useGlobalPipes(
    new ValidationPipe({ disableErrorMessages: true, transform: true, transformOptions: { enableImplicitConversion: true } }),
  );
  app.use(bodyParser.json({ limit: "500mb" }));
  app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));

  app.set("trust proxy", true);

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({
    app: expressApp,
    binarySettings: {
      isBinary: ({ headers }: { headers: Record<string, string> }) => {
        const result =
          Boolean(headers) && Boolean(headers["content-type"]) && headers["content-type"].includes("application/vnd.mapbox-vector-tile");
        return result;
      },
      contentTypes: ["application/vnd.mapbox-vector-tile"],
    },
  });
}

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
