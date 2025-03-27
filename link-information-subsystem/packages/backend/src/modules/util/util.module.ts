import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CoordinateService } from "./coordinate.service";
import { EnumSet } from "src/entities/traffic/enum-set.entity";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";
import { ShapefileService } from "./shapefile.service";
import { PrefCity } from "src/entities/share/pref-cities.entity";
import { SchemaRelationService } from "./schema-relation.service";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { CodeNameService } from "./code-name.service";
import { CodeMaster } from "src/entities/share/code-master.entity";
import { S3Service } from "./s3.service";
import { SnsNotificationService } from "./sns-notification.service";
import { SnsErrorCount } from "src/entities/share/sns-error-counts";
import { LoggerModule } from "./logger/logger.module";
import { LoggerService } from "./logger/logger.service";
import { DateFormatService } from "./date-format.service";

@Module({
  imports: [TypeOrmModule.forFeature([SchemaRelation, EnumSet, MergedLink, PrefCity, CodeMaster, SnsErrorCount]), LoggerModule],
  controllers: [],
  providers: [
    CoordinateService,
    ShapefileService,
    SchemaRelationService,
    CodeNameService,
    S3Service,
    SnsNotificationService,
    LoggerService,
    DateFormatService,
  ],
  exports: [
    CoordinateService,
    ShapefileService,
    SchemaRelationService,
    CodeNameService,
    S3Service,
    SnsNotificationService,
    LoggerService,
    DateFormatService,
  ],
})
export class UtilModule {}
