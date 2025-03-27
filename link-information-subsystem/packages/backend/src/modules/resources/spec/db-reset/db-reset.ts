import { DataSource } from "typeorm";
import { SharedResources } from "../../../../entities/share/shared-resources.entity";

const datasource = new DataSource({
  type: "postgres",
  host: "database",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "postgres",
  entities: [SharedResources],
});

export const resetDb = async () => {
  const sharedResourcesRepository = datasource.getRepository(SharedResources);
  await sharedResourcesRepository.createQueryBuilder("sr").delete().where("key= :key", { key: "A0JYEyM3-21453354856" }).execute();
  await datasource.destroy();
};

export const createDb = async () => {
  await datasource.initialize();
  const sharedResourcesRepository = datasource.getRepository(SharedResources);
  const base64 =
    "JTdCJTIybW9iaWxpdHlIdWJJZCUyMiUzQSUyMkUxQS0wMDEtVSUyMiUyQyUyMmZyZWlnaHRJZCUyMiUzQSUyMjEyMy00NTYtNzg5JTIyJTJDJTIydHJ1Y2tJZCUyMiUzQSUyMiVFNSU5MyU4MSVFNSVCNyU5RCUyMDEwMiUyMCVFMyU4MSU4MiUyMDEwLTA5JTIyJTJDJTIyc2l6ZUNsYXNzJTIyJTNBJTIybGFyZ2UyMDUwQ2xhc3MlMjIlN0Q=";
  await sharedResourcesRepository
    .createQueryBuilder("sr")
    .insert()
    .into(SharedResources)
    .values([
      {
        id: 1,
        dataModelType: "test1",
        category: "mobilityhub",
        key: "A0JYEyM3-21453354856",
        value: base64,
        validFrom: "2024-10-21T09:00Z",
        validTo: "2024-10-21T10:00Z",
      },
    ])
    .execute();
};
