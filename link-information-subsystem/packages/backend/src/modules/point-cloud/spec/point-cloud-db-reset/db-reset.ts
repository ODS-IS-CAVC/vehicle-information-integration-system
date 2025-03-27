import { PointCloudSplitManage } from "src/entities/share/point-cloud-split-manage.entity";
import { DataSource } from "typeorm";

const datasource = new DataSource({
  type: "postgres",
  host: "database",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "postgres",
  entities: [PointCloudSplitManage],
});

export const resetDb = async () => {
  await datasource.initialize();
  const pointCloudSplitManageRepository = datasource.getRepository(PointCloudSplitManage);
  await pointCloudSplitManageRepository
    .createQueryBuilder("pcsm")
    .delete()
    .where("point_cloud_unique_id= :pointCloudUniqueId", { pointCloudUniqueId: 1 })
    .andWhere("user_id= :userId", { userId: 10 })
    .andWhere("start_lat= :startLat", { startLat: 30.123456789 })
    .andWhere("start_lon= :startLon", { startLon: 130.123456789 })
    .andWhere("end_lat= :endLat", { endLat: 31.123456789 })
    .andWhere("end_lon= :endLon", { endLon: 131.123456789 })
    .execute();

  await datasource.destroy();
};

export const createDb = async () => {
  await datasource.initialize();
  const pointCloudSplitManageRepository = datasource.getRepository(PointCloudSplitManage);
  await pointCloudSplitManageRepository
    .createQueryBuilder("pcsm")
    .insert()
    .into(PointCloudSplitManage)
    .values([
      {
        userId: 10,
        pointCloudUniqueId: 1,
        startLat: 30.123456789,
        startLon: 130.123456789,
        endLat: 31.123456789,
        endLon: 131.123456789,
      },
    ])
    .execute();
  await pointCloudSplitManageRepository
    .createQueryBuilder("pcsm")
    .update(PointCloudSplitManage)
    .set({
      id: 0,
    })
    .where("point_cloud_unique_id= :pointCloudUniqueId", { pointCloudUniqueId: 1 })
    .andWhere("user_id= :userId", { userId: 10 })
    .andWhere("start_lat= :startLat", { startLat: 30.123456789 })
    .andWhere("start_lon= :startLon", { startLon: 130.123456789 })
    .andWhere("end_lat= :endLat", { endLat: 31.123456789 })
    .andWhere("end_lon= :endLon", { endLon: 131.123456789 })
    .execute();
  await datasource.destroy();
};
