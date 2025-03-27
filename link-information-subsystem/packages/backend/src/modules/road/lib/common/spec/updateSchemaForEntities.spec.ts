import { HdSdRelation } from "src/entities/himozuke/hd-sd-relation.entity";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";
import { HdIntersectionMapping } from "src/entities/ushr-format/hd-intersection-mapping.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { mockDataSource } from "src/spec/mockDataSource";
import { SelectQueryBuilder } from "typeorm";
import { updateSchemaForEntities } from "../entity-utils";

jest.mock("typeorm", () => {
  const originalModule = jest.requireActual("typeorm");
  return {
    ...originalModule,
    SelectQueryBuilder: jest.fn().mockImplementation(() => {
      return {
        connection: {
          entityMetadatas: [
            {
              name: "HdLaneCenterLine",
              tableMetadataArgs: { schema: "viewer" },
              schema: "viewer",
              tableName: "hd_lane_center_lines",
              tablePath: "viewer.hd_lane_center_lines",
            },
            {
              name: "HdIntersectionMapping",
              tableMetadataArgs: { schema: "ushr_format" },
              schema: "ushr_format",
              tableName: "intersection_road_segment_mapping",
              tablePath: "ushr_format.intersection_road_segment_mapping",
            },
            {
              name: "MergedLink",
              tableMetadataArgs: { schema: "sdmap" },
              schema: "sdmap",
              tableName: "merged_links",
              tablePath: "sdmap.merged_links",
            },
            {
              name: "HdSdRelation",
              tableMetadataArgs: { schema: "himozuke" },
              schema: "himozuke",
              tableName: "final_himozuke_hd_sd_set",
              tablePath: "himozuke.final_himozuke_hd_sd_set",
            },
          ],
        },
      };
    }),
  };
});

const schemaRelation: SchemaRelation = {
  recordId: 3,
  viewerVersion: 20241031,
  hdmapVersion: 20240919,
  sdmapVersion: 20240823,
  himozukeVersion: 20241007,
  createdAt: new Date("2024-10-31T00:26:27.655Z"),
  updatedAt: new Date("2024-10-31T00:26:27.655Z"),
  hasId: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  softRemove: jest.fn(),
  recover: jest.fn(),
  reload: jest.fn(),
};

describe("updateSchemaForEntities", () => {
  beforeAll(async () => {
    jest.spyOn(mockDataSource, "initialize").mockResolvedValue(mockDataSource);
    await mockDataSource.initialize();
  });

  beforeAll(async () => {
    jest.spyOn(mockDataSource, "destroy").mockResolvedValue();
    await mockDataSource.destroy();
  });

  it("対象エンティティのスキーマに対してバージョン情報が付与されること", () => {
    const query = new SelectQueryBuilder<any>(mockDataSource);
    const entityNames = [HdLaneCenterLine.name, HdIntersectionMapping.name, MergedLink.name, HdSdRelation.name];
    updateSchemaForEntities(query, entityNames, schemaRelation);

    expect(query.connection.entityMetadatas[0].schema).toBe("viewer_20241031");
    expect(query.connection.entityMetadatas[1].schema).toBe("ushr_format_20240919");
    expect(query.connection.entityMetadatas[2].schema).toBe("sdmap_20240823");
    expect(query.connection.entityMetadatas[3].schema).toBe("himozuke_20241007");
  });
});
