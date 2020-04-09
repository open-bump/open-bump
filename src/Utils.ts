import Discord from "discord.js";
import path from "path";
import Guild from "./models/Guild";
import OpenBump from "./OpenBump";

export default class Utils {
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
      return require(path.join(OpenBump.instance.directory, "package.json"));
    } catch (error) {}
    try {
      return require(path.join(
        OpenBump.instance.directory,
        "..",
        "package.json"
      ));
    } catch (error) {}
    throw new Error(`Can't load package.json!`);
  }

  public static async ensureGuild(guild: Discord.Guild): Promise<Guild> {
    const databaseManager = OpenBump.instance.databaseManager;
    const transaction = await databaseManager.sequelize.transaction();
    try {
      const existingGuild = await Guild.findOne({
        where: { id: guild.id },
        transaction
      });
      if (existingGuild) {
        existingGuild.name = guild.name;
        if (existingGuild.changed()) await existingGuild.save({ transaction });
        await transaction.commit();
        return existingGuild;
      } else {
        const newGuild = await Guild.create(
          {
            id: guild.id,
            name: guild.name
          },
          { transaction }
        );
        await transaction.commit();
        const finalGuild = await Guild.findOne({
          where: { id: guild.id }
        });
        return finalGuild || newGuild; // Use "finalGuild" with more data; and as fallback "newGuild"
      }
    } catch (error) {
      console.error(`Error while ensuring guild, rolling back...`);
      await transaction.rollback();
      throw error;
    }
  }
}
