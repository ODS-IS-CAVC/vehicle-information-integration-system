import { Column, Entity, MultiPolygon, PrimaryColumn } from "typeorm";

@Entity({ schema: "share", name: "pref_cities" })
export class PrefCity {
  @PrimaryColumn("varchar", { name: "pref_city_code" })
  prefCityCode: string;

  @Column("varchar", { name: "pref_code" })
  prefCode: string;

  @Column("varchar", { name: "pref_name" })
  prefName: string;

  @Column("varchar", { name: "city_name" })
  cityName: string;

  @Column("geometry", { name: "geom", spatialFeatureType: "MultiPolygon", srid: 6697, select: false })
  geom: MultiPolygon;
}
