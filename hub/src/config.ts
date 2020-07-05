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
  discord: {
    token: string;
    shards: number;
  };
  settings: {
    wsPort: number;
    httpPort: number;
    logs: {
      shards: string;
    };
  };
  patreon: {
    enabled: boolean;
    file: string;
    campaign: string;
  };
}

export default config as IConfig;
