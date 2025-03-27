import { SelectQueryBuilder } from "typeorm";
import { RoadName } from "../road-name";
import { createMock } from "@golevelup/ts-jest";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";

describe("RoadName", () => {
  let mockQuery: jest.Mocked<SelectQueryBuilder<any>>;

  beforeEach(() => {
    mockQuery = createMock<SelectQueryBuilder<any>>();
    mockQuery.innerJoin.mockReturnValue(mockQuery);
    mockQuery.andWhere.mockReturnValue(mockQuery);
    mockQuery.setParameter.mockReturnValue(mockQuery);
  });

  it("リクエストパラメーターに道路名称が指定された場合に条件式に追加されること", () => {
    const roadName = "小樽定山渓線";

    RoadName.addFilterRoadNameQuery(mockQuery, roadName);

    expect(mockQuery.innerJoin).toHaveBeenCalledWith(SdRoadName, "rn", "rn.roadCode = sd.roadNameCode");
    expect(mockQuery.andWhere).toHaveBeenCalledWith("(rn.displayName LIKE :roadName OR rn.officialName LIKE :roadName)");
    expect(mockQuery.setParameter).toHaveBeenCalledWith("roadName", `%${roadName}%`);
  });
  it("リクエストパラメーターに道路名称が指定されなかった場合に条件式が追加されないこと", () => {
    const roadName = "";
    RoadName.addFilterRoadNameQuery(mockQuery, roadName);
    expect(mockQuery.innerJoin).not.toHaveBeenCalled();
    expect(mockQuery.andWhere).not.toHaveBeenCalled();
    expect(mockQuery.setParameter).not.toHaveBeenCalled();
  });
});
