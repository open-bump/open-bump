import * as path from "path";
import * as quickdb from "quick.db";
import { Sequelize, SequelizeOptions } from "sequelize-typescript";
import * as database from "./database.json";
import Guild from "./models/Guild";

interface IGuildData {
  id: string;
  invite?: string;
  feed?: string;
  description?: string;
  color?: number;
  banner?: string;
}

function resolveInvitecode(data: string) {
  const inviteRegex = /discord(?:app\.com\/invite|\.gg(?:\/invite)?)\/([\w-]{2,255})/i;
  const match = inviteRegex.exec(data);
  if (match && match[1]) return match[1];
  return data;
}

async function run() {
  const inviteRegex = /^inv_/gim;
  const channelRegex = /^channel_/gim;
  const descriptionRegex = /^desc_/gim;
  const colorRegex = /^color_/gim;
  const bannerRegex = /^banner_/gim;
  // const _cooldownRegex = /^cooldown_/gim;

  const modelDir = path.join(__dirname, "models");

  const sequelize = new Sequelize({
    ...database,
    models: [modelDir],
    logging: false
  } as SequelizeOptions);

  await sequelize.authenticate();
  console.log("Successfully connected to database");

  const guilds: { [id: string]: IGuildData } = {};

  function getGuild(id: string) {
    let guild = guilds[id];
    if (guild) return guild;
    guild = { id };
    guilds[id] = guild;
    return guild;
  }

  const guildsWithChannels: Array<string> = quickdb.get("guildInfo.guilds");

  for (const item of quickdb.all()) {
    const id = item.ID;
    let data = null;
    try {
      data = JSON.parse(item.data);
    } catch (error) {
      data = item.data;
    }

    if (id.match(inviteRegex)) {
      const guildId = id.replace(inviteRegex, "");
      const guild = getGuild(guildId);
      const invite = resolveInvitecode(data);
      guild.invite = invite;
    } else if (id.match(channelRegex)) {
      const guildId = id.replace(channelRegex, "");
      const guild = getGuild(guildId);
      if (guildsWithChannels.includes(guildId)) guild.feed = data;
    } else if (id.match(descriptionRegex)) {
      const guildId = id.replace(descriptionRegex, "");
      const guild = getGuild(guildId);
      guild.description = data;
    } else if (id.match(colorRegex)) {
      const guildId = id.replace(colorRegex, "");
      const guild = getGuild(guildId);
      guild.color = data;
    } else if (id.match(bannerRegex)) {
      const guildId = id.replace(bannerRegex, "");
      const guild = getGuild(guildId);
      guild.banner = data;
    }
  }

  const queryInterface = sequelize.getQueryInterface();

  console.log(`Loaded ${Object.keys(guilds).length} guilds`);

  for (const id of Object.keys(guilds)) {
    const guildData = guilds[id];
    let guildDatabase = await Guild.scope("default").findOne({ where: { id } });
    if (!guildDatabase) {
      await Guild.scope("default").create({ id });
      guildDatabase = await Guild.scope("default").findOne({ where: { id } });
      if (!guildDatabase) {
        console.log(`Skipped guild ${guildData.id} due to unexpected flow`);
        continue;
      }
    }
    if (!guildDatabase.bumpData)
      guildDatabase.bumpData = await guildDatabase.$create("bumpData", {});
    if (guildData.invite) guildDatabase.bumpData.invite = guildData.invite;
    if (guildData.feed) guildDatabase.feed = guildData.feed;
    if (guildData.description)
      guildDatabase.bumpData.description = guildData.description;
    if (guildData.color) guildDatabase.bumpData.color = guildData.color;
    if (guildData.banner) guildDatabase.bumpData.banner = guildData.banner;
    await guildDatabase.save();
    await guildDatabase.bumpData.save();
    console.log(`Created guild ${guildData.id}`);
  }

  console.log("Successfully finished migration");
}

run();
