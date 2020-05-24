import fetch from "node-fetch";
import path from "path";
import config from "./config";
import Hub from "./Hub";

class Notifications {
  public static async postShardConnected(shard: number) {
    return await this.post({
      color: Utils.Colors.ORANGE,
      description: `Shard \`#${shard}\` connected`
    });
  }

  public static async postShardReady(shard: number) {
    return await this.post({
      color: Utils.Colors.GREEN,
      description: `Shard \`#${shard}\` ready`
    });
  }

  public static async postShardDisconnected(shard: number, force = false) {
    return await this.post({
      color: Utils.Colors.RED,
      description: `Shard \`#${shard}\` disconnected`
    });
  }

  private static async post(content: object | string) {
    if (!config.settings.logs?.shards) return;
    await fetch(config.settings.logs.shards, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(
        typeof content === "string"
          ? { content }
          : {
              embeds: [content]
            }
      )
    });
  }
}

export default class Utils {
  public static Notifications = Notifications;

  public static mergeObjects<T extends object = object>(
    target: T,
    ...sources: Array<T>
  ): T {
    if (!sources.length) return target;
    const source = sources.shift() as any | undefined;
    if (source === undefined) return target;

    if (this.isMergeableObject(target) && this.isMergeableObject(source)) {
      Object.keys(source).forEach((key: string) => {
        if (this.isMergeableObject(source[key])) {
          if (!(target as any)[key]) (target as any)[key] = {};
          this.mergeObjects((target as any)[key], source[key]);
        } else {
          (target as any)[key] = source[key];
        }
      });
    }
    return this.mergeObjects(target, ...sources);
  }

  public static isObject(item: any): boolean {
    return item !== null && typeof item === "object";
  }

  public static isMergeableObject(item: object): boolean {
    return this.isObject(item) && !Array.isArray(item);
  }

  public static getPackageJson() {
    try {
      return require(path.join(Hub.instance.directory, "package.json"));
    } catch (error) {}
    try {
      return require(path.join(Hub.instance.directory, "..", "package.json"));
    } catch (error) {}
    throw new Error(`Can't load package.json!`);
  }

  public static getShardId(guildId: string, shards: number) {
    const nGuildId = BigInt(guildId);
    return Number((nGuildId >> BigInt(22)) % BigInt(shards));
  }

  public static Colors = {
    BLUE: 0x698cce,
    RED: 0xff0000,
    GREEN: 0x3dd42c,
    ORANGE: 0xff9900,
    OPENBUMP: 0x27ad60
  };

  public static Emojis = {
    IMPORTANTNOTICE: "⚠️",
    CHECK: "✅",
    EXCLAMATION: "❗"
  };
}
