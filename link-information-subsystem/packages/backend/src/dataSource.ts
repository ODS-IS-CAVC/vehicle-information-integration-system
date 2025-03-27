import { config } from "dotenv";
import { DataSource } from "typeorm";

config({ path: ".env" });

export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  entities: ["src/entities/**/.ts"],
  migrations: ["migrations/*.ts"],
});
