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
    admins: Array<string>;
  };
  settings: {
    hub: string;
    prefix: string;
    support: string;
    cooldown: {
      default: number;
      min: number;
      feed: number;
      vote: number;
    };
    features: Array<string>;
    logs: {
      guilds: string;
    };
    patreon: string;
    nitroboost?: {
      server: string;
      bonus: number;
    };
    patreonRoles?: Array<{
      guild: string;
      role: string;
      cost: number;
    }>;
    servermate: {
      user: string;
      trigger: string;
    };
  };
  lists: {
    topgg: {
      enabled: boolean;
      token: string;
    };
  };
}

export default config as IConfig;
