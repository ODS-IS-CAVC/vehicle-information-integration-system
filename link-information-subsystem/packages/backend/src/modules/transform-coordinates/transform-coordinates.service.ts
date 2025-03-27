import { BadRequestException, Injectable } from "@nestjs/common";
import { ZFXYTile } from "src/ouranos-gex-lib/dist/zfxy";
import { bbox as turfBBox } from "@turf/turf";
import { Space } from "ouranos-gex-lib-for-javascript";

import { GEODETIC } from "src/shares/lib/proj4";
import { CoordinateService } from "../util/coordinate.service";
import { Line, Point } from "src/type/coordinates";
import { LngLatWithAltitude } from "src/ouranos-gex-lib/src/types";
import { VoxelsQueryDTO } from "./dto/voxels-query.dto";
import { LineStringsQueryDTO } from "./dto/line-string-query.dto";
import { BBoxQueryDTO } from "./dto/bbox-query.dto";
import { LoggerService } from "../util/logger/logger.service";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { SchemaRelationService } from "../util/schema-relation.service";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { updateSchemaForEntities } from "../road/lib/common/entity-utils";
import { CropMap } from "../shares/crop/crop";
import { GeometryIntersection } from "./geometry-intersection";
import { LineString } from "geojson";
import { ZFXY_1M_ZOOM_BASE } from "src/ouranos-gex-lib/src/zfxy";

@Injectable()
export class TransformCoordinatesService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly coordinateService: CoordinateService,
    private readonly loggerService: LoggerService,
    private readonly schemaRelationService: SchemaRelationService,
  ) {}

  /**
   * 指定した値を空間IDへ変換
   * @param condition bbox, mesh, cityのいずれかが含む
   * @returns 空間ID
   */
  async getVoxels(condition: VoxelsQueryDTO): Promise<ZFXYTile[]> {
    let geom;

    try {
      const geomKeys = ["bbox", "city", "mesh"];
      const hasGeomKeys = geomKeys.some((key) => condition?.hasOwnProperty(key));
      if (!hasGeomKeys) {
        throw new BadRequestException();
      }

      const { zoomLevel = ZFXY_1M_ZOOM_BASE } = condition;

      if (condition.bbox) {
        // bboxをNumber[]へ変換
        condition.bbox = String(condition.bbox).split(",").map(Number);
      } else if (condition.mesh) {
        const bbox = this.coordinateService.transformMeshToBBox(condition.mesh);
        condition.bbox = bbox;
      }

      // bbox, cityをmultiPolygonへ変換
      geom = await CropMap.createCropMultiPolygon(this.dataSource, {
        // バウンディングボックス
        bbox: condition.bbox,
        // 行政区画コード
        cities: condition.city,
      });

      // roadNameがある場合、交差点のGeometry取得
      if (condition.roadName) {
        const query = this.dataSource.createQueryBuilder();
        const schemaRelation = await this.schemaRelationService.getSchemaRelation();
        updateSchemaForEntities(query, [SdRoadName.name, MergedLink.name], schemaRelation);

        // 道路名からGeometry情報を取得し、ST_Intersectionで共通部分のGeometry情報取得
        GeometryIntersection.getRoadNameAndGeomIntersection(query, geom, condition.roadName);

        const rows = await query.getRawMany();

        if (rows.length === 0) {
          return rows;
        }

        // ouranosで空間IDへ変換
        const voxels: ZFXYTile[] = rows.map((row) => {
          const parseIntersection = JSON.parse(row.intersection);
          return Space.boundingSpaceForGeometry(parseIntersection, zoomLevel).zfxy;
        });
        return voxels;
      }
      // ouranosで空間IDへ変換
      const voxels: ZFXYTile[] = [Space.boundingSpaceForGeometry(geom, zoomLevel).zfxy];
      return voxels;
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }

  /**
   * 指定した値をLineStringへ変換
   * @param condition 2地点の空間ID
   * @returns LineString
   */
  async getLineString(condition: LineStringsQueryDTO): Promise<Line[] | Point[]> {
    const lines: Line[] = [];

    try {
      const voxelsKeys = ["startX", "startY", "startZ", "endX", "endY", "endZ"];
      const hasVoxels = voxelsKeys.every((key) => condition?.hasOwnProperty(key));

      if (!hasVoxels) {
        throw new BadRequestException();
      } else {
        const { startX, startY, startZ, startF, endX, endY, endZ, endF, roadName, geodetic = GEODETIC.EPSG6668 } = condition;

        const startVoxel: ZFXYTile = {
          x: startX,
          y: startY,
          z: startZ,
          f: startF,
        };

        const endVoxel: ZFXYTile = {
          x: endX,
          y: endY,
          z: endZ,
          f: endF,
        };

        // 空間IDの中心点取得
        const startVoxelCenter = new Space(startVoxel).center;
        const endVoxelCenter = new Space(endVoxel).center;

        if (roadName) {
          const geom: LineString = {
            type: "LineString",
            coordinates: [
              [startVoxelCenter.lng, startVoxelCenter.lat],
              [endVoxelCenter.lng, endVoxelCenter.lat],
            ],
          };

          const query = this.dataSource.createQueryBuilder();
          const schemaRelation = await this.schemaRelationService.getSchemaRelation();
          updateSchemaForEntities(query, [SdRoadName.name, MergedLink.name], schemaRelation);
          // 道路名からGeometry情報を取得し、ST_Intersectionで共通部分のGeometry情報取得
          GeometryIntersection.getRoadNameAndGeomIntersection(query, geom, roadName);

          const rows = await query.getRawMany();

          if (rows.length === 0) {
            return rows;
          }

          let lines: Point[];

          lines = rows.map((row) => {
            const parsePoint = JSON.parse(row.intersection);
            const [lon, lat] = parsePoint.coordinates;
            return { lon, lat };
          });

          // 座標系指定がある場合
          if (geodetic !== GEODETIC.EPSG6668) {
            lines = this.coordinateService.transformCoordinates(GEODETIC.EPSG6668, GEODETIC.EPSG4326, lines);
          }

          return lines;
        }

        // 座標変換
        const transformLonAndLat = (center: LngLatWithAltitude) => {
          const transformedVoxelCenter = this.coordinateService.transformCoordinates(GEODETIC.EPSG6668, geodetic, [
            { lat: center.lat, lon: center.lng },
          ]);
          lines.push(transformedVoxelCenter);
        };

        if (geodetic !== GEODETIC.EPSG6668) {
          // 座標系指定がある場合
          transformLonAndLat(startVoxelCenter);
          transformLonAndLat(endVoxelCenter);
        } else {
          lines.push([{ lon: startVoxelCenter.lng, lat: startVoxelCenter.lat }]);
          lines.push([{ lon: endVoxelCenter.lng, lat: endVoxelCenter.lat }]);
        }
      }
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }

    return lines;
  }

  /**
   * 指定した値をバウンディングボックスへ変換
   * @param condition voxel, mesh, cityのいずれか含む
   * @returns bbox
   */
  async getBBox(condition: BBoxQueryDTO): Promise<number[]> {
    let bbox: number[];

    try {
      const geomKeys = ["x", "y", "z", "f", "city", "mesh"];
      const hasGeomKeys = geomKeys.some((key) => condition?.hasOwnProperty(key));

      if (!hasGeomKeys) {
        throw new BadRequestException();
      }

      const { x, y, z, f, mesh, city, geodetic = GEODETIC.EPSG6668 } = condition;

      if (x !== undefined && y !== undefined && z !== undefined) {
        const voxel = { x, y, z, f };

        // 空間IDの頂点座標取得
        const topPoints = this.coordinateService.transformVoxelToTopPoints([voxel]);

        // 最小の緯度経度取得取得
        const minBBox = topPoints[0].sort((a, b) => {
          return a.lat - b.lat || a.lon - b.lon;
        })[0];

        // 最大の緯度経度取得取得
        const maxBBox = topPoints[0].sort((a, b) => {
          return b.lat - a.lat || b.lon - a.lon;
        })[0];

        bbox = [minBBox.lon, minBBox.lat, maxBBox.lon, maxBBox.lat];
      }

      if (mesh) {
        bbox = this.coordinateService.transformMeshToBBox(mesh, geodetic);
      }

      if (city) {
        // cityをmultiPolygonへ変換
        const multiPolygon = await CropMap.createCropMultiPolygon(this.dataSource, { cities: condition.city });
        bbox = turfBBox(multiPolygon);
      }

      // 座標系指定がある場合
      if (geodetic !== GEODETIC.EPSG6668) {
        const [minLon, minLat, maxLon, maxLat] = bbox;
        const latAndLon = [
          { lon: minLon, lat: minLat },
          { lon: maxLon, lat: maxLat },
        ];
        const transformCoordinates = this.coordinateService.transformCoordinates(GEODETIC.EPSG6668, geodetic, latAndLon);
        const [minLonAndLat, maxLonAndLat] = transformCoordinates;
        bbox = [minLonAndLat.lon, minLonAndLat.lat, maxLonAndLat.lon, maxLonAndLat.lat];
      }

      return bbox;
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
}
