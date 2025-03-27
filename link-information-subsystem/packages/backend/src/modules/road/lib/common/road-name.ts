import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SelectQueryBuilder } from "typeorm";

export class RoadName {
  /**
   * 道路名検索用の条件をQueryBuilderに追加
   *
   * @param query
   * @param roadName
   * @param columnName
   * @returns
   */
  static addFilterRoadNameQuery(query: SelectQueryBuilder<any>, roadName: string, columnName = "sd.roadNameCode") {
    if (!roadName) {
      return;
    }

    return query
      .innerJoin(SdRoadName, "rn", `rn.roadCode = ${columnName}`)
      .andWhere("(rn.displayName LIKE :roadName OR rn.officialName LIKE :roadName)")
      .setParameter("roadName", `%${roadName}%`);
  }
}
