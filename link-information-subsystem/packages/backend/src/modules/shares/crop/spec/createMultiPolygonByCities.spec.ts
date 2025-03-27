import { DataSource, SelectQueryBuilder } from "typeorm";
import { CropMap } from "../crop";
import { PrefCity } from "src/entities/share/pref-cities.entity";

describe("Crop.createMultiPolygonByCities", () => {
  let mockQueryBuilder: Partial<SelectQueryBuilder<any>>;
  let mockDataSource: Partial<DataSource>;

  beforeAll(async () => {
    mockQueryBuilder = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    mockDataSource = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder as SelectQueryBuilder<any>),
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("行政区画コードがセットされた場合、対象範囲のGeoJSONが返却されること", async () => {
    const city = "01101";
    const mockGeoJson = '{"type":"MultiPolygon","coordinates":[[[[130.5,33.5],[130.5,34],[131,34],[131,33.5],[130.5,33.5]]]]}';

    (mockQueryBuilder.getRawOne as jest.Mock).mockResolvedValue({ geom: mockGeoJson });

    const result = await CropMap.createMultiPolygonByCities(mockDataSource as DataSource, city);

    expect(mockDataSource.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mockQueryBuilder.select).toHaveBeenCalledWith("ST_AsGeoJSON(ST_Transform(ST_Union(pc.geom), 6697))", "geom");
    expect(mockQueryBuilder.from).toHaveBeenCalledWith(PrefCity, "pc");
    expect(mockQueryBuilder.where).toHaveBeenCalledWith("pc.prefCityCode = :city", { city: "01101" });
    expect(mockQueryBuilder.getRawOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual(JSON.parse(mockGeoJson));
  });
});
