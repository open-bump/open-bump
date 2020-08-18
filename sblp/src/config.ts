import config from "config";

interface IConfig extends config.IConfig {
  database:
    | {
        dialect: "mysql";
        host: string;
        database: string;
        username: string;
        password: string;
      }
    | {
        dialect: "sqlite";
        storage: string;
      };
  settings: {
    port: number;
    proxyAuth: string;
  };
}

export default config as IConfig;
