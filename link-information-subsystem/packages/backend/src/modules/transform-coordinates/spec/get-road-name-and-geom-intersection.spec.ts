import { DataSource } from "typeorm";
import { GeometryIntersection } from "../geometry-intersection";
import { LineString } from "geojson";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { Test } from "@nestjs/testing";

describe("GeometryIntersection", () => {
  let dataSourceMock;

  beforeEach(async () => {
    const createQueryBuilderMock = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
    };

    dataSourceMock = {
      createQueryBuilder: jest.fn(() => createQueryBuilderMock),
    };

    await Test.createTestingModule({
      providers: [{ provide: DataSource, useValue: dataSourceMock }],
    }).compile();
  });

  it("roadName[石垣]とgeometry[LineString]を指定する場合、クエリに条件式が追加されること", () => {
    const roadName = "石垣";
    const geom: LineString = {
      type: "LineString",
      coordinates: [
        [122.94062197208405, 24.450524017183824],
        [122.93704926967621, 24.451842509872154],
      ],
    };

    const queryMock = dataSourceMock.createQueryBuilder();

    GeometryIntersection.getRoadNameAndGeomIntersection(queryMock, geom, roadName);

    expect(queryMock.innerJoin).toHaveBeenCalledWith(SdRoadName, "rn", "rn.roadCode = ml.roadNameCode");
    expect(queryMock.andWhere).toHaveBeenCalledWith("(rn.displayName LIKE :roadName OR rn.officialName LIKE :roadName)");
    expect(queryMock.andWhere).toHaveBeenCalledWith(`ST_Intersects(ST_Transform(ST_GeomFromGeoJSON(:geojsonString), 6697), ml.geom)`, {
      geojsonString: JSON.stringify(geom),
    });
    expect(queryMock.setParameter).toHaveBeenCalledWith("geojsonString", JSON.stringify(geom));
    expect(queryMock.setParameter).toHaveBeenCalledWith("roadName", `%${roadName}%`);
  });
});
