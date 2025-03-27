import { SnsErrorCount } from "src/entities/share/sns-error-counts";
import { DataSource } from "typeorm";

const datasource = new DataSource({
  type: "postgres",
  host: "database",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "postgres",
  entities: [SnsErrorCount],
});

export const resetDb = async () => {
  await datasource.initialize();
  const snsErrorCountRepository = datasource.getRepository(SnsErrorCount);
  await snsErrorCountRepository.createQueryBuilder("sec").delete().where("content= :content", { content: "errorcontent" }).execute();
  await datasource.destroy();
};

export const createDb = async () => {
  await datasource.initialize();
  const snsErrorCountRepository = datasource.getRepository(SnsErrorCount);

  await snsErrorCountRepository
    .createQueryBuilder("sec")
    .insert()
    .into(SnsErrorCount)
    .values([
      {
        id: 0,
        type: "a",
        content: "errorcontent",
        threshold: 3,
        count: 0,
      },
    ])
    .execute();
  await datasource.destroy();
};
