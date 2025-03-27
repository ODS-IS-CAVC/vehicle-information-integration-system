import { mockDataSource } from "src/spec/mockDataSource";
import { CropMap } from "../crop";
import { UnprocessableEntityException } from "@nestjs/common";

describe("Crop.createCropMultiPolygon", () => {
  const condition = {
    bbox: [1, 2, 3, 4],
    cities: [14101, 14102],
  };

  beforeAll(async () => {
    jest.spyOn(mockDataSource, "initialize").mockResolvedValue(mockDataSource);
    await mockDataSource.initialize();
  });

  afterAll(async () => {
    jest.spyOn(mockDataSource, "destroy").mockResolvedValue();
    await mockDataSource.destroy();
  });

  let spyPrefCityCreateMultiPolygonByCities: jest.SpyInstance;

  beforeEach(async () => {
    spyPrefCityCreateMultiPolygonByCities = jest
      .spyOn(CropMap, "createMultiPolygonByCities")
      .mockResolvedValue({ type: "MultiPolygon", coordinates: [[[[11, 12]]]] });
  });

  describe("範囲条件が複数存在する場合", () => {
    it("バウンディングボックスを指定した際にgeometryが取得できること", async () => {
      const bboxCondition = { bbox: condition.bbox };
      const result = await CropMap.createCropMultiPolygon(mockDataSource, bboxCondition);
      expect(result).toMatchObject({
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [1, 2],
              [1, 4],
              [3, 4],
              [3, 2],
              [1, 2],
            ],
          ],
        ],
      });
    });

    it("行政区画コードを指定した際にgeometryが取得できること", async () => {
      const citiesCondition = { cities: condition.cities };
      const result = await CropMap.createCropMultiPolygon(mockDataSource, citiesCondition);
      expect(result).toEqual({ type: "MultiPolygon", coordinates: [[[[11, 12]]]] });

      expect(spyPrefCityCreateMultiPolygonByCities).toHaveBeenCalledWith(mockDataSource, [14101, 14102]);
    });
  });

  it("範囲指定、行政区画指定、ファイル指定全てにおいて範囲が取れなかった場合、UnprocessableEntityExceptionがThrowされること", async () => {
    await expect(() => CropMap.createCropMultiPolygon(mockDataSource, {})).rejects.toThrow(new UnprocessableEntityException());
  });
});
