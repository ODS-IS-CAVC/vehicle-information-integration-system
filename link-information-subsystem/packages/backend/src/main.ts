import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { Logger } from "nestjs-pino";
import * as bodyParser from "body-parser";
import { NestExpressApplication } from "@nestjs/platform-express";

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
  app.setGlobalPrefix("/v1");
  app.use(bodyParser.json({ limit: "500mb" }));
  app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));

  app.set("trust proxy", true);

  const config = new DocumentBuilder().setTitle("DMP_DIGI_LINE").setDescription("TODO").setVersion("0.0.1").build();
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup("openapi", app, document);

  await app.listen(3000);
}
bootstrap();
