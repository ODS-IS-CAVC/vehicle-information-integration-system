import { Space } from "ouranos-gex-lib-for-javascript";
import ogr2ogr from "ogr2ogr";
import { Dirent, mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import { randomUUID } from "crypto";
import admZip from "adm-zip";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ZFXYTile } from "src/ouranos-gex-lib/src/zfxy";
import { S3Service } from "./s3.service";
import { MAX_ZOOM_LEVEL } from "src/consts/coordinate.const";
import { ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import { LoggerService } from "./logger/logger.service";
import axios from "axios";

/**
 * Shapefileを空間IDに変換する
 */
@Injectable()
export class ShapefileService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * 共通関数：S3上のshapefileから空間IDに変換
   * @param bucket
   * @param key
   * @param zoomLevel
   * @returns 空間IDの配列
   */
  async transformShapefileToVoxels(bucket: string, key: string, zoomLevel: number = MAX_ZOOM_LEVEL): Promise<ZFXYTile[]> {
    // ズームレベルのチェック
    if (zoomLevel > MAX_ZOOM_LEVEL) {
      this.loggerService.error(new BadRequestException());
      throw new BadRequestException();
    }

    // ファイルサイズが10KB以下かどうかチェック
    const res: ListObjectsV2CommandOutput = await this.s3Service.getS3FileAttributes(bucket, key);
    if (res.Contents.length && res.Contents[0].Size > 10 * 1024) {
      this.loggerService.error(new Error("File size exceeds the 10KB limit."));
      throw new Error("File size exceeds the 10KB limit.");
    }

    // ファイル仮置き場
    const uuid: string = randomUUID();
    const basePath: string = `/app/.temp/${uuid}`;
    let geoJson = undefined;
    try {
      // s3でのダウンロードURL取得
      const zipFileUrl: string = await this.s3Service.createPresignedUrlWithClient(bucket, key);
      // ZIPファイルをダウンロード
      const response = await axios.get(zipFileUrl, { responseType: "arraybuffer" });
      const zipFileBuffer = Buffer.from(response.data, "binary");
      const zipFilePath = `${basePath}/downloaded.zip`;

      // ZIPファイルを保存
      mkdirSync(basePath, { recursive: true });
      writeFileSync(zipFilePath, zipFileBuffer);

      // ZIPファイル解凍
      await new admZip(zipFilePath).extractAllTo(basePath, true, false); // 解凍して上書き

      const fullPaths: {
        shpPath: string;
        prjPath: string;
      } = this.searchShpFullPath(basePath);

      // shp,dbf,shx,shp,prjファイルがそろっていなければエラー
      if (!fullPaths) {
        throw new BadRequestException();
      }
      // geoJsonに変換
      geoJson = await ogr2ogr(fullPaths.shpPath, {
        options: [
          "-s_srs",
          fullPaths.prjPath, //変換前の座標系情報の参照元
          "-t_srs",
          "EPSG:6668", //変換後の座標系(JGD2011)
        ],
      });

      // 変換できたかチェック
      if (!geoJson.data || !geoJson.data.features || !geoJson.data.features.length || !geoJson.data.features[0].geometry) {
        this.loggerService.error(new Error("Failed to transform shapefile to geojson."));
        throw new Error("Failed to transform shapefile to geojson.");
      }

      //空間IDに変換
      const voxels: ZFXYTile[] = [];
      for (let j = 0; j < geoJson.data.features.length; j++) {
        const feature = geoJson.data.features[j];
        if (feature.geometry) {
          const spaces: Space[] = Space.spacesForGeometry(feature.geometry, zoomLevel);
          if (spaces) {
            for (let k = 0; k < spaces.length; k++) {
              voxels.push(spaces[k].zfxy);
            }
          }
        }
      }
      return voxels;
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    } finally {
      // ファイル仮置き場から削除
      rmSync(basePath, { recursive: true, force: true });
    }
  }

  /**
   * dbf,shx,shp,prjファイルの有無を確認し、shp拡張子のファイルのパスを取得
   * @param path
   * @returns
   */
  private searchShpFullPath(path: string): {
    shpPath: string;
    prjPath: string;
  } {
    const files: Dirent[] = readdirSync(path, { withFileTypes: true });
    let dbfExists: boolean = false;
    let shxExists: boolean = false;
    let prjPath: string | undefined = undefined;
    let shpPath: string | undefined = undefined;
    for (const file of files) {
      if (file.isDirectory()) {
        return this.searchShpFullPath(file.path + "/" + file.name);
      } else {
        if (file.name.endsWith(".shp")) {
          shpPath = file.path + "/" + file.name;
        }
        if (file.name.endsWith(".dbf")) {
          dbfExists = true;
        }
        if (file.name.endsWith(".shx")) {
          shxExists = true;
        }
        if (file.name.endsWith(".prj")) {
          prjPath = file.path + "/" + file.name;
        }
      }
      // dbf,shx,shp,prjファイルが存在する場合
      if (shpPath && prjPath && dbfExists && shxExists) {
        return {
          shpPath: shpPath,
          prjPath: prjPath,
        };
      }
    }
    return undefined;
  }
}
