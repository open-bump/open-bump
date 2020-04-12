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
    shard?: number;
  };
  settings: {
    prefix: string;
    support: string;
    cooldown: {
      default: number;
      min: number;
    };
  };
}

export default config as IConfig;
