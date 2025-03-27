import { DataSource } from "typeorm";

export const mockDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "test",
  password: "test",
  database: "test",
  entities: [],
  synchronize: false,
});
