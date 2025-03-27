import { IsArray, IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Validate, ValidateNested } from "class-validator";
import { IsGeometry, IsBBox, IsCity, IsMesh, IsOnlyTimestamp, IsStartAndEndTimestamp, IsGeometryOptional } from "../../shares/dto.validate";
import { ApiProperty, ApiPropertyOptional, ApiPropertyOptions, OmitType } from "@nestjs/swagger";
import { Position } from "geojson";
import { Type } from "class-transformer";
import { mixin } from "@nestjs/common";
import { RoadHdLaneCenterProperties } from "./road-hd-lane-center-properties";
import { RoadHdLaneLineProperties } from "./road-hd-lane-line-properties";
import { RoadHdRoadEdgeProperties } from "./road-hd-road-edge-properties";
import { RoadHdPavementMarkingProperties } from "./road-hd-road-pavement-marking-properties";
import { RoadHdIIntersectionProperties } from "./road-hd-intersection-properties";
import { RoadHdSignProperties } from "./road-hd-sign-properties";
import { RoadTrafficProperties } from "./road-traffic-properties";
import { RoadTripTimeProperties } from "./road-trip-time-properties";
import { RoadEntryExitProperties } from "./road-entry-exit-properties";
import { RoadConstructionEventProperties } from "./road-construction-event-properties";
import { MAP_SOURCE, roadRegulationTypes } from "src/consts/map.const";
import { RoadWinterClosureProperties } from "./road-winter-closure-properties";

export class CommonRoadGeoJSONGetQueryDTO {
  @ApiPropertyOptional({
    description: "C-2-2[B] バウンディングボックス（矩形領域座標)データモデル。SW(経度), SW(緯度), NE(経度), NE(緯度)",
    format: "double",
    example: "[139.681994465,35.50676814,139.681985082,35.506773265]",
    type: [Number],
  })
  @IsOptional()
  @Validate(IsBBox)
  @Validate(IsGeometry)
  bbox: number[];

  @ApiPropertyOptional({
    description: "voxel x（東西方向）インデックス",
    format: "int32",
    example: "12",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Validate(IsGeometry)
  x: number;

  @ApiPropertyOptional({
    description: "voxel y（南北方向）インデックス",
    format: "int32",
    example: "23",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Validate(IsGeometry)
  y: number;

  @ApiPropertyOptional({
    description: "voxel z ズームレベル",
    format: "int32",
    example: "24",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Validate(IsGeometry)
  z: number;

  @ApiPropertyOptional({
    description: "voxel f（鉛直方向）インデックス",
    format: "int32",
    example: "0",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  f: number;

  @ApiPropertyOptional({
    description: "C-2-2[B] 行政区画コード データモデル",
    type: "int32",
    example: "1203",
  })
  @IsOptional()
  @Validate(IsCity)
  @Validate(IsGeometry)
  city: string;

  @ApiPropertyOptional({
    description: "C-2-2[B] メッシュコード データモデル 1st-mesh=4digits, 2nd-mesh=6digits, 3rd-mesh=8digits",
    type: "int32",
    example: "123456",
  })
  @IsOptional()
  @Validate(IsMesh)
  @Validate(IsGeometry)
  mesh: number;

  @ApiPropertyOptional({
    description: "タイムスタンプ。（もしあれば）指定タイムスタンプより古いデータの中から最も新しいデータを取得する。省略時は最新版。",
    example: "2024-01-23T11:22:33Z",
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsGeometryOptional)
  timestamp: string;

  @ApiPropertyOptional({
    description: "道路名称。道路名称絞り込み対象の場合に指定可能。",
  })
  @IsOptional()
  @IsString()
  @Validate(IsGeometryOptional)
  roadName: string;
}

export class HdLaneCenterGeoJSONGetQueryDTO extends CommonRoadGeoJSONGetQueryDTO {
  @ApiPropertyOptional({
    description:
      "C-2-2[B] 絞り込み対象の交通規制情報データモデル。絞り込みをしない場合は指定しないこと。\n\n" +
      "・SPEED: 速度制限\n\n" +
      "・NOPASS: 通行禁止\n\n" +
      "・ONEWAY: 一方通行\n\n" +
      "・NOTURN: 指定方向外進入禁止\n\n" +
      "・ZONE30: ゾーン30\n\n",
    example: "SPEED",
  })
  @IsOptional()
  @IsIn(roadRegulationTypes)
  @Validate(IsGeometryOptional)
  reg: string;
}

export class RoadGeoJSONWithTimestampGetQueryDTO extends CommonRoadGeoJSONGetQueryDTO {
  @ApiPropertyOptional({
    description:
      "検索対象期間（開始日時（包含））。startTimestamp指定時はendTimestampの指定が必須。timestampの指定不可。）。検索対象期間と規制対象期間（規制開始日時～規制解除予定日時）の積が空でないデータを取得する。検索対象期間・timestampともに省略された時は日時によるフィルタリングを行わない。",
    example: "2024-01-23T15:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsStartAndEndTimestamp)
  @Validate(IsOnlyTimestamp)
  @Validate(IsGeometryOptional)
  startTimestamp: string;

  @ApiPropertyOptional({
    description:
      "検索対象期間（終了日時（排他））。endTimestamp指定時はstartTimestampの指定が必須。timestampの指定不可。）。検索対象期間と規制対象期間（規制開始日時～規制解除予定日時）の積が空でないデータを取得する。検索対象期間・timestampともに省略された時は日時によるフィルタリングを行わない。",
    example: "2024-01-23T18:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsStartAndEndTimestamp)
  @Validate(IsOnlyTimestamp)
  @Validate(IsGeometryOptional)
  endTimestamp: string;
}

export class CommonRoadGeoJSONGetWithoutTimestampQueryDTO extends OmitType(CommonRoadGeoJSONGetQueryDTO, ["timestamp"] as const) {}

export class CRSDto {
  @ApiProperty({
    description: "name",
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: "properties(EPSGコード)",
  })
  @IsString()
  properties: { name: string };
}

export class GeometryDto {
  @ApiProperty({
    description: "ジオメトリ形式",
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: "CRS",
  })
  crs: CRSDto;

  @ApiProperty({
    type: "array",
    items: { type: "array", items: { type: "number" } },
    description: "C-2-2[B] 座標列(LineString)データモデル",
  })
  coordinates: Position | Position[];
}

export class FeatureDto<T> {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @ValidateNested()
  geometry: GeometryDto;

  @ApiProperty()
  @ValidateNested()
  properties: T;
}

export class FeatureCollectionDto<T> {
  @ApiProperty({
    description: "フィーチャID",
  })
  @IsString()
  type: string;

  @ApiProperty({
    type: () => [FeatureDto],
    description: "フィーチャ配列",
  })
  @IsArray()
  @ValidateNested({ each: true })
  features: FeatureDto<T>[];
}

type Constructor<T = object> = new (...args: any[]) => T;

export const withFeature = <TBase extends Constructor>(Base: TBase, options?: ApiPropertyOptions | undefined) => {
  class FeatureDto {
    @ApiProperty()
    @IsString()
    type: string;

    @ApiProperty()
    @ValidateNested()
    @Type(() => GeometryDto)
    geometry: GeometryDto;

    @ApiProperty({
      type: () => Base,
      ...options,
    })
    @ValidateNested()
    properties: InstanceType<TBase>;
  }
  return mixin(FeatureDto);
};

export class RoadHdLaneCenterFeatures extends withFeature(RoadHdLaneCenterProperties) {}
export class RoadHdLaneLineFeatures extends withFeature(RoadHdLaneLineProperties) {}
export class RoadHdRoadEdgeFeatures extends withFeature(RoadHdRoadEdgeProperties) {}
export class RoadHdIntersectionLineFeatures extends withFeature(RoadHdIIntersectionProperties) {}
export class RoadHdPavementMarkingFeatures extends withFeature(RoadHdPavementMarkingProperties) {}
export class RoadHdSignFeatures extends withFeature(RoadHdSignProperties) {}
export class RoadHdTrafficFeatures extends withFeature(RoadTrafficProperties) {}
export class RoadTripTimeFeatures extends withFeature(RoadTripTimeProperties) {}
export class RoadEntryExitFeatures extends withFeature(RoadEntryExitProperties) {}
export class RoadConstructionEventFeatures extends withFeature(RoadConstructionEventProperties) {}
export class RoadWinterClosureFeatures extends withFeature(RoadWinterClosureProperties) {}

export const withFeatureCollection = <TBase extends Constructor>(Base: TBase, options?: ApiPropertyOptions | undefined) => {
  class FeatureCollectionDto {
    @ApiProperty({
      description: "フィーチャID",
    })
    @IsString()
    type: string;

    @ApiProperty({
      type: () => [Base],
      description: "フィーチャ配列",
      ...options,
    })
    @ValidateNested({ each: true })
    features: InstanceType<TBase>[];
  }
  return mixin(FeatureCollectionDto);
};

export class RoadHdLaneCenterGetResponse extends withFeatureCollection(RoadHdLaneCenterFeatures) {}
export class RoadHdLaneLineGetResponse extends withFeatureCollection(RoadHdLaneLineFeatures) {}
export class RoadHdRoadEdgeGetResponse extends withFeatureCollection(RoadHdRoadEdgeFeatures) {}
export class RoadHdIntersectionLineGetResponse extends withFeatureCollection(RoadHdIntersectionLineFeatures) {}
export class RoadHdPavementMarkingGetResponse extends withFeatureCollection(RoadHdPavementMarkingFeatures) {}
export class RoadHdSignGetResponse extends withFeatureCollection(RoadHdSignFeatures) {}

export class RoadHdTrafficGetResponse extends withFeatureCollection(RoadHdTrafficFeatures) {}
export class RoadTripTimeGetResponse extends withFeatureCollection(RoadTripTimeFeatures) {}
export class RoadEntryExitGetResponse extends withFeatureCollection(RoadEntryExitFeatures) {}

export class RoadConstructionEventGetResponse extends withFeatureCollection(RoadConstructionEventFeatures) {}

export class RoadWinterClosureGetResponse extends withFeatureCollection(RoadWinterClosureFeatures) {}

export class RoadPBFGetParamDTO {
  @ApiProperty({
    description: "取得データ種別",
  })
  @IsIn([
    MAP_SOURCE.HD_LANE_CENTER,
    MAP_SOURCE.HD_LANE_LINE,
    MAP_SOURCE.HD_ROAD_EDGE,
    MAP_SOURCE.HD_INTERSECTION,
    MAP_SOURCE.HD_PAVEMENT_MARKING,
    MAP_SOURCE.HD_SIGN,
    MAP_SOURCE.SD_ROAD_LINK,
    MAP_SOURCE.SD_ROAD_NODE,
    MAP_SOURCE.TRAFFIC,
    MAP_SOURCE.CONSTRUCTION_EVENT,
    MAP_SOURCE.ENTRY_EXIT,
    MAP_SOURCE.TRIP_TIME,
    MAP_SOURCE.WINTER_CLOSURE,
    MAP_SOURCE.WATER_FILM_THICKNESS,
    MAP_SOURCE.WIND,
  ])
  sourceId: string;

  @ApiProperty({
    description: "ズームレベル(Z)",
    format: "int32",
    example: "13",
  })
  @Type(() => Number)
  @IsInt()
  z: number;

  @ApiProperty({
    description: "Xタイル番号",
    format: "int32",
    example: "7273",
  })
  @Type(() => Number)
  @IsInt()
  x: number;

  @ApiProperty({
    description: "Yタイル番号",
    format: "int32",
    example: "3229",
  })
  @Type(() => Number)
  @IsInt()
  y: number;
}

export class RoadPBFGetQueryDTO {
  @ApiPropertyOptional({
    description: "タイムスタンプ。（もしあれば）指定タイムスタンプより古いデータの中から最も新しいデータを取得する。省略時は最新版。",
    example: "2024-01-23T11:22:33Z",
  })
  @Validate(IsDateString)
  timestamp: string;
}

export class RoadExtraTrafficGetParamDTO {
  @ApiProperty({
    description: "HDロードセグメントID",
    format: "int32",
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  roadSegmentId: number;
}
