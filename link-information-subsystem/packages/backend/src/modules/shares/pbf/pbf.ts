import { SelectQueryBuilder } from "typeorm";
import { Response } from "express";

export class PBF {
  static addPBFGeometryQuery(query: SelectQueryBuilder<any>, condition: { x: number; y: number; z: number }, geomColumnName = "tg.geom") {
    const tileEnvelope = "ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)";

    query
      .andWhere(`${geomColumnName} && ${tileEnvelope}`)
      .setParameters({ x: condition.x, y: condition.y, z: condition.z })
      .addSelect(`ST_AsMVTGeom(${geomColumnName}, ${tileEnvelope})`);

    return query;
  }

  static setResponse(res: Response, fileName: string, buffer: Buffer) {
    res.setHeader("Content-Type", `application/vnd.mapbox-vector-tile`);
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}.pbf`);
    res.send(buffer);
  }
}
