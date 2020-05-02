import * as path from "path";
import { Sequelize, SequelizeOptions } from "sequelize-typescript";
import * as data from "./data.json";
import * as database from "./database.json";
import Guild from "./models/Guild";

interface IGuildData {
  id: string;
  bump?: {
    description?: string;
    invite?: string;
    color?: number;
    banner?: string;
  };
  feed?: string;
}

function resolveInvitecode(data: string) {
  const inviteRegex = /discord(?:app\.com\/invite|\.gg(?:\/invite)?)\/([\w-]{2,255})/i;
  const match = inviteRegex.exec(data);
  if (match && match[1]) return match[1];
  return data;
}

async function run() {
  const modelDir = path.join(__dirname, "models");

  const sequelize = new Sequelize({
    ...database,
    models: [modelDir],
    logging: false
  } as SequelizeOptions);

  await sequelize.authenticate();
  console.log("Successfully connected to database");

  const guilds: { [id: string]: IGuildData } = {};

  for (const guild of data.guilds) {
    guilds[guild.id] = guild;
  }

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
    if (guildData.bump?.invite)
      guildDatabase.bumpData.invite = guildData.bump.invite;
    if (guildData.feed) guildDatabase.feed = guildData.feed;
    if (guildData.bump?.description)
      guildDatabase.bumpData.description = guildData.bump.description;
    if (guildData.bump?.color)
      guildDatabase.bumpData.color = guildData.bump.color;
    if (guildData.bump?.banner)
      guildDatabase.bumpData.banner = guildData.bump.banner;
    await guildDatabase.save();
    await guildDatabase.bumpData.save();
    console.log(`Created guild ${guildData.id}`);
  }

  console.log("Successfully finished migration");
}

run();
