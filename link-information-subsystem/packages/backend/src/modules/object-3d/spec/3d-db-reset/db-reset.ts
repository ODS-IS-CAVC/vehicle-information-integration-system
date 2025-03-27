import { Objects3dOperation } from "src/entities/3d/object-3d-operation.entity";
import { Objects3d } from "src/entities/3d/object-3d.entity";
import { DataSource } from "typeorm";

const datasource = new DataSource({
  type: "postgres",
  host: "database",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "postgres",
  entities: [Objects3d, Objects3dOperation],
  poolSize: 10,
});

export const resetDb = async () => {
  await datasource.initialize();

  const objects3dOperationRepository = datasource.getRepository(Objects3dOperation);
  await objects3dOperationRepository.createQueryBuilder("3d0").delete().execute();

  const objects3dRepository = datasource.getRepository(Objects3d);
  await objects3dRepository.createQueryBuilder("3d").delete().execute();

  await datasource.destroy();
};

export const createDb = async () => {
  await datasource.initialize();

  const objects3dOperationRepository = datasource.getRepository(Objects3dOperation);
  await objects3dOperationRepository.createQueryBuilder("3do").delete().execute();

  const objects3dRepository = datasource.getRepository(Objects3d);
  await objects3dRepository.createQueryBuilder("3d").delete().execute();

  await objects3dRepository
    .createQueryBuilder("3d")
    .insert()
    .into(Objects3d)
    .values([
      {
        s3Bucket: "UNITTEST_AWS_S3_OBJECT3D_BUCKET",
        s3Key: "UNITTEST_AWS_S3_KEY",
        title: "UNITTEST_FILE_NAME.obj",
        fileName: "UNITTEST_FILE_NAME.obj",
      },
    ])
    .execute();

  await objects3dRepository
    .createQueryBuilder("3d")
    .update(Objects3d)
    .set({
      id: 0,
    })
    .where("s3_bucket= :s3_bucket", { s3_bucket: "UNITTEST_AWS_S3_OBJECT3D_BUCKET" })
    .andWhere("s3_key= :s3_key", { s3_key: "UNITTEST_AWS_S3_KEY" })
    .andWhere("title= :title", { title: "UNITTEST_FILE_NAME.obj" })
    .andWhere("filename= :filename", { filename: "UNITTEST_FILE_NAME.obj" })
    .execute();

  await objects3dOperationRepository
    .createQueryBuilder("3do")
    .insert()
    .into(Objects3dOperation)
    .values([
      {
        title: "UNITTEST_TITLE",
        pointCloudUniqueId: 1,
        id3dObject: 0,
        coordinates: [10.123456789, 10.123456789, 10.123456789],
        xRotation: 10.123456789,
        yRotation: 10.123456789,
        zRotation: 10.123456789,
        scale: 10.123456789,
      },
    ])
    .execute();

  await objects3dOperationRepository
    .createQueryBuilder("3do")
    .update(Objects3dOperation)
    .set({
      id: 0,
    })
    .where("title= :title", { title: "UNITTEST_TITLE" })
    .andWhere("point_cloud_unique_id= :point_cloud_unique_id", { point_cloud_unique_id: 1 })
    .andWhere("id_3d_object= :id_3d_object", { id_3d_object: 0 })
    .execute();

  await datasource.destroy();
};
