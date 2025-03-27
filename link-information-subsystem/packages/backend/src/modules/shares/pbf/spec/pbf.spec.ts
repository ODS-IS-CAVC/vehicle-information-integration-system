import { SelectQueryBuilder } from "typeorm";
import { PBF } from "../pbf";
import { Response } from "express";
import { createMock } from "@golevelup/ts-jest";
import { mockDataSource } from "src/spec/mockDataSource";

describe("PBF", () => {
  let query: SelectQueryBuilder<any>;

  beforeAll(async () => {
    jest.spyOn(mockDataSource, "initialize").mockResolvedValue(mockDataSource);
    await mockDataSource.initialize();
  });

  beforeAll(async () => {
    jest.spyOn(mockDataSource, "destroy").mockResolvedValue();
    await mockDataSource.destroy();
  });

  beforeEach(() => {
    query = mockDataSource.createQueryBuilder();
  });

  describe("addPBFGeometryQuery", () => {
    it("XYZの絞込が行われること", () => {
      query = mockDataSource.createQueryBuilder();
      const condition = { x: 10000, y: 5000, z: 16 };

      PBF.addPBFGeometryQuery(query, condition);

      expect(query.getParameters()).toMatchObject({ x: 10000, y: 5000, z: 16 });
    });
  });

  describe("setResponse", () => {
    const fileName = "test";
    const buffer = Buffer.from("testzip");

    let res: Response;
    let spySetHeader: jest.SpyInstance;
    let spySend: jest.SpyInstance;
    beforeEach(() => {
      res = createMock<Response>();
      spySetHeader = jest.spyOn(res, "setHeader");
      spySend = jest.spyOn(res, "send");
    });

    it("HeaderにContent-Type: application/vnd.mapbox-vector-tile がセットされること", () => {
      PBF.setResponse(res, fileName, buffer);

      expect(spySetHeader).toHaveBeenNthCalledWith(1, "Content-Type", "application/vnd.mapbox-vector-tile");
    });

    it("HeaderにContent-Disposition: attachment; filename=[fileName].pbf がセットされること", () => {
      PBF.setResponse(res, fileName, buffer);

      expect(spySetHeader).toHaveBeenNthCalledWith(2, "Content-Disposition", "attachment; filename=test.pbf");
    });

    it("受け取ったBufferの内容が送られること", () => {
      PBF.setResponse(res, fileName, buffer);

      expect(spySend).toHaveBeenCalledWith(buffer);
    });
  });
});
