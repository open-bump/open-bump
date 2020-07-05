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
    admins: Array<string>;
  };
  settings: {
    nitroboost?: {
      server: string;
      bonus: number;
    };
    patreonRoles?: Array<{
      guild: string;
      role: string;
      cost: number;
    }>;
  };
}

export default config as IConfig;
