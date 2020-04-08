import config from "config";

interface IConfig extends config.IConfig {
  discord: {
    token: string;
  };
}

export default config as IConfig;
