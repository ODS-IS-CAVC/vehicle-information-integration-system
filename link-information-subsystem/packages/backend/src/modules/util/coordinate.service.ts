import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EnumSet } from "src/entities/traffic/enum-set.entity";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";
import { Space } from "src/ouranos-gex-lib/src";
import { ZFXY_1M_ZOOM_BASE, ZFXYTile } from "src/ouranos-gex-lib/src/zfxy";
import { Repository } from "typeorm";
import proj4 from "proj4";
import { Geodetic, GEODETIC } from "src/shares/lib/proj4";
import { Line, Point } from "src/type/coordinates";
import { Decimal } from "decimal.js";
import { SchemaRelationService } from "./schema-relation.service";
import { MAX_ZOOM_LEVEL } from "src/consts/coordinate.const";
import { LoggerService } from "./logger/logger.service";

@Injectable()
export class CoordinateService {
  constructor(
    @InjectRepository(EnumSet)
    private readonly enumSetRepository: Repository<EnumSet>,
    @InjectRepository(MergedLink)
    private readonly mergedLinksRepository: Repository<MergedLink>,
    private readonly schemaRelationService: SchemaRelationService,
    private readonly loggerService: LoggerService,
  ) {}

  // 上下・東西南北の周辺空間ID取得
  private getSurroundingVoxels(space: Space) {
    const upVoxel = space.up().zfxy;
    const downVoxel = space.down().zfxy;
    const eastVoxel = space.east().zfxy;
    const westVoxel = space.west().zfxy;
    const southVoxel = space.south().zfxy;
    const northVoxel = space.north().zfxy;
    const surrounding = [upVoxel, downVoxel, eastVoxel, westVoxel, southVoxel, northVoxel];
    return surrounding;
  }

  // 指定した座標へ変換
  private getTransformedCoordinate(points: Point[], geodetic: Geodetic) {
    let transformedPoints: Point[];
    if (geodetic !== GEODETIC.EPSG6668) {
      try {
        // 座標変換
        const transformedCoordinates = this.transformCoordinates(GEODETIC.EPSG6668, geodetic, points);
        transformedPoints = transformedCoordinates;
      } catch (e) {
        this.loggerService.error(e);
        throw e;
      }
    } else {
      transformedPoints = points;
    }

    return transformedPoints;
  }

  /**
   * 座標変換
   * @param originGeodetic 現在の座標系
   * @param targetGeodetic 変換したい座標系
   * @param points
   * @returns 変換後の座標
   */
  transformCoordinates(originGeodetic: Geodetic, targetGeodetic: Geodetic, points: Point[]): Point[] {
    const transformedLatAndLon: Point[] = points.map((point) => {
      const transform = proj4(originGeodetic, targetGeodetic, [point.lon, point.lat]);
      const [lon, lat] = transform;
      return { lon, lat };
    });
    return transformedLatAndLon;
  }

  /**
   * 空間ID(Line指定)取得
   * @param lines
   * @param zoomLevel ズームレベル
   * @param geodetic 座標系
   * @returns 空間ID
   */
  transformLineToVoxels(lines: Line[], zoomLevel: number = ZFXY_1M_ZOOM_BASE, geodetic: Geodetic = GEODETIC.EPSG6668): ZFXYTile[][] {
    const voxels: ZFXYTile[][] = [];

    lines.forEach((line) => {
      const voxelsArr: ZFXYTile[] = [];

      // 座標変換
      const transformedCoordinates = this.getTransformedCoordinate(line, geodetic);

      transformedCoordinates.forEach(
        // Pointを空間IDに変換
        (point) => {
          const space = new Space({ lat: point.lat, lng: point.lon }, zoomLevel);
          const sid = { ...space.zfxy };
          voxelsArr.push(sid);
        },
      );
      voxels.push(voxelsArr);
    });
    return voxels;
  }

  /**
   * Point指定して空間ID取得
   * @param points
   * @param zoomLevel ズームレベル
   * @param geodetic 座標系
   * @returns 空間ID
   */
  transformPointToVoxels(points: Point[], zoomLevel: number = ZFXY_1M_ZOOM_BASE, geodetic: Geodetic = GEODETIC.EPSG6668): ZFXYTile[] {
    // 座標変換
    const transformedCoordinates = this.getTransformedCoordinate(points, geodetic);

    // 空間ID取得
    const voxels = transformedCoordinates.map((point) => {
      const zfxy = new Space({ lng: point.lon, lat: point.lat }, zoomLevel).zfxy;
      return zfxy;
    });
    return voxels;
  }

  /**
   * 空間ID(Polygon指定)取得
   * @param polygons
   * @param zoomLevel ズームレベル
   * @param geodetic 座標系
   * @returns 空間ID
   */
  transformPolygonToVoxels(polygons: Line[], zoomLevel: number = ZFXY_1M_ZOOM_BASE, geodetic: Geodetic = GEODETIC.EPSG6668) {
    const voxels = polygons.map((polygon) => {
      // 座標変換
      const transformedCoordinates = this.getTransformedCoordinate(polygon, geodetic);

      // 空間ID取得
      const zfxyArray = transformedCoordinates.map((y) => new Space({ lng: y.lon, lat: y.lat }, zoomLevel).zfxy).slice(0, -1);
      return zfxyArray;
    });
    return voxels;
  }

  /**
   * 空間ID頂点座標(空間ID指定)取得
   * @param voxels 空間ID
   * @returns 頂点座標
   */
  transformVoxelToTopPoints(voxels: ZFXYTile[]): Point[][] {
    // 頂点座標取得
    const coordinates = voxels.map((voxel) => {
      const vertices = new Space(voxel).vertices3d();
      const LonAndLat = vertices.map((v) => {
        return { lon: v[0], lat: v[1] };
      });
      return LonAndLat;
    });

    return coordinates;
  }

  /**
   * 指定したPointの上下東西南北方向にある6個の空間ID取得
   * @param points
   * @param zoomLevel ズームレベル
   * @param geodetic 座標系
   * @returns 上下・東西南北方向にある6個の空間ID
   */
  transformPointToSurroundingVoxels(
    points: Point[],
    zoomLevel: number = ZFXY_1M_ZOOM_BASE,
    geodetic: Geodetic = GEODETIC.EPSG6668,
  ): ZFXYTile[][] {
    const transformedCoordinates = this.getTransformedCoordinate(points, geodetic);

    const voxels = transformedCoordinates.map((point) => {
      const space = new Space({ lng: point.lon, lat: point.lat }, zoomLevel);
      const voxels = this.getSurroundingVoxels(space);
      return voxels;
    });
    return voxels;
  }

  /**
   * 指定した空間IDの上下東西南北方向にある6個の空間ID取得
   * @param voxels 空間ID
   * @returns 上下・東西南北方向にある6個の空間ID
   */
  transformVoxelToSurroundingVoxels(voxels: ZFXYTile[]): ZFXYTile[][] {
    const surroundingVoxels = voxels.map((voxel) => {
      // Spaceオブジェクトへ変換
      const space = new Space(voxel);

      // 上下東西南北の空間ID取得
      const voxels = this.getSurroundingVoxels(space);
      return voxels;
    });
    return surroundingVoxels;
  }

  /**
   * メッシュコードから緯度経度へ変換
   * @param meshCode メッシュコード
   * @returns 緯度経度
   */
  transformMeshToLatAndLon(meshCode: number) {
    // 文字列に変換
    const meshCodeString = String(meshCode);

    // 1次メッシュの計算
    const codeFirstTwo = parseInt(meshCodeString.substring(0, 2));
    const codeThirdForth = parseInt(meshCodeString.substring(2, 4));
    let lat = new Decimal(codeFirstTwo * 2).div(3).toNumber();
    let lon = new Decimal(codeThirdForth).plus(100).toNumber();

    // 2次メッシュの計算
    if (meshCodeString.length >= 6) {
      const codeFifth = parseInt(meshCodeString.substring(4, 5));
      const codeSixth = parseInt(meshCodeString.substring(5, 6));
      lat += new Decimal(codeFifth).times(2).div(3).div(8).toNumber();
      lon += new Decimal(codeSixth).div(8).toNumber();
    }

    // 3次メッシュの計算
    if (meshCodeString.length === 8) {
      const codeSeventh = parseInt(meshCodeString.substring(6, 7));
      const codeEighth = parseInt(meshCodeString.substring(7, 8));
      lat += new Decimal(codeSeventh).times(2).div(3).div(8).div(10).toNumber();
      lon += new Decimal(codeEighth).div(8).div(10).toNumber();
    }
    return { lon, lat };
  }

  /**
   * メッシュコードをBBOXへ変換
   * @param mesh
   * @param geodetic 座標系
   * @returns bbox
   */
  transformMeshToBBox(mesh: number, geodetic: Geodetic = GEODETIC.EPSG6668) {
    // 緯度経度取得
    const minLatAndLon = this.transformMeshToLatAndLon(mesh);
    // 座標系変換
    const transformedMinLatAndLon = this.getTransformedCoordinate([minLatAndLon], geodetic)[0];

    const maxLon = new Decimal(transformedMinLatAndLon.lon);
    const maxLat = new Decimal(transformedMinLatAndLon.lat);
    const hoursToMinutes = new Decimal(60);
    const hoursToSeconds = new Decimal(3600);

    const bboxs = [maxLon.toNumber(), maxLat.toNumber()];

    if (String(mesh).length === 4) {
      bboxs.push(maxLon.plus(1).toNumber());
      bboxs.push(maxLat.plus(new Decimal(40).div(hoursToMinutes)).toNumber());
    } else if (String(mesh).length === 6) {
      bboxs.push(maxLon.plus(new Decimal(450).div(hoursToSeconds)).toNumber());
      bboxs.push(maxLat.plus(new Decimal(5).div(hoursToMinutes)).toNumber());
    } else if (String(mesh).length === 8) {
      bboxs.push(maxLon.plus(new Decimal(45).div(hoursToSeconds)).toNumber());
      bboxs.push(maxLat.plus(new Decimal(30).div(hoursToSeconds)).toNumber());
    }

    return bboxs;
  }

  /**
   * リンクIDを空間IDに変換する
   * @param linkId リンクID
   * @param zoomLevel ズームレベル
   * @returns 空間ID
   */
  async transformLinkIdToVoxels(linkId: number, zoomLevel: number = MAX_ZOOM_LEVEL): Promise<ZFXYTile[]> {
    if (zoomLevel > MAX_ZOOM_LEVEL) {
      this.loggerService.error(new BadRequestException());
      throw new BadRequestException();
    }

    try {
      //指定されたリンクIDをもとにsd_link_id取得
      const linkIds: number[] = (await this.enumSetRepository.findBy({ trafficLinkId: linkId })).map((sdLink) => sdLink.linkId);

      //SDmapスキーマの最新バージョンを取得
      const { sdmapVersion } = await this.schemaRelationService.getSchemaRelation();

      //該当バージョンのmerged_linksからジオメトリ情報取得
      const geoJsons = await this.mergedLinksRepository.query(
        `SELECT ST_AsGeoJSON(geom) AS geom FROM sdmap_${sdmapVersion}.merged_links WHERE objectid IN (${linkIds.join(",")})`,
      );

      //空間ID取得
      let voxels: ZFXYTile[] = [];
      for (let i = 0; i < geoJsons.length; i++) {
        const geoJson = geoJsons[i];
        const spaces: ZFXYTile[] = Space.spacesForGeometry(JSON.parse(geoJson.geom), zoomLevel).map((voxel) => voxel.zfxy);
        voxels = voxels.concat(spaces);
      }

      return voxels;
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
}
