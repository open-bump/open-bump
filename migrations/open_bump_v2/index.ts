// Imports
export const environment_ = "production";

const OldGuild = require("./oldmodels/Guild");
const OldUser = require("./oldmodels/User");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const common = require("./utils/common");
import path from "path";
import { Sequelize, SequelizeOptions } from "sequelize-typescript";
import * as database from "./database.json";
import AssignedTier from "./models/AssignedTier";
import Guild from "./models/Guild";
import PremiumTier from "./models/PremiumTier";
import User from "./models/User";
import * as donator from "./utils/donator";
import GuildFeature from "./models/GuildFeature";
const moment = require("moment");
const ms = require("ms");

const run = async () => {
  // Config
  const config = require(`./config.${environment_}.json`);
  module.exports.config = config;

  // Migration
  const startMigration = async () => {
    console.log("Starting migration...");

    // Guilds
    const guilds = await OldGuild.find({});
    console.log(`Found ${guilds.length} guilds`);

    const migrateGuilds: Array<{
      id: string;
      bumpData: {
        color: number | null;
        description: string | null;
        invite: string | null;
        banner: string | null;
      };
      name: string | null;
      autoBump: boolean;
      features: Array<string>;
      prefix: string | null;
      bumps: number;
      feed: string | null;
    }> = [];

    for (const guild of guilds) {
      const id = guild.id;
      if (id) {
        const bumpData = {
          color: guild.bump?.color,
          description: guild.bump?.description,
          invite: guild.bump?.invite,
          banner: guild.bump?.banner
        };
        const name = guild.name || null;
        const autoBump = guild.autoBump || false;
        const features: Array<string> = guild.features || [];
        const prefix = guild.settings?.prefix || null;
        const bumps = guild.bumps || 0;
        const feed = guild.feed || null;

        // Migrate
        migrateGuilds.push({
          id,
          bumpData,
          name,
          autoBump,
          features,
          prefix,
          bumps,
          feed
        });
      }
    }

    // Users
    const users = await OldUser.find({});
    console.log(`Found ${users.length} users`);

    const migrateUsers: Array<{
      id: string;
      nitroBooster: boolean;
      donatorBonus: number;
      assignedTiers: Array<{ guild: string; tier: string }>;
    }> = [];

    for (const user of users) {
      const id = user.id;
      if (id) {
        const nitroBooster = user.nitroBooster || false;
        const donatorBonus = user.donator?.bonus || 0;
        const assignedTiers = [];
        if (user.donator.assigned) {
          for (const assignedTier of user.donator.assigned) {
            const guild = assignedTier.id;
            const tierId = assignedTier.tier;
            const tier = Object.keys(donator.tiers)
              .map((key) => donator.tiers[key])
              .find((tier) => tier.id === tierId);
            const tierName = tier.name;
            assignedTiers.push({ guild, tier: tierName });
          }
        }
        if (nitroBooster || donatorBonus || assignedTiers.length) {
          // Migrate
          migrateUsers.push({ id, nitroBooster, donatorBonus, assignedTiers });
        }
      }
    }

    // Insert to new database
    // Guilds
    let index = 0;
    for (const guild of migrateGuilds) {
      console.log(
        `Creating guild ${guild.id}... ${++index}/${migrateGuilds.length}`
      );
      await Guild.upsert({ id: guild.id });
      const guildDatabase = await Guild.scope("default").findOne({
        where: { id: guild.id }
      });

      if (!guildDatabase) {
        console.log("Weird error #1");
        continue;
      }

      guildDatabase.name = guild.name;
      guildDatabase.autobump = guild.autoBump;
      guildDatabase.prefix = guild.prefix;
      (guildDatabase.totalBumps = guild.bumps),
        (guildDatabase.feed = guild.feed);

      if (!guildDatabase.bumpData)
        guildDatabase.bumpData = await guildDatabase.$create("bumpData", {
          description: guild.bumpData.description,
          invite: guild.bumpData.invite,
          banner: guild.bumpData.banner,
          color: guild.bumpData.color
        });

      for (const feature of guild.features) {
        await GuildFeature.create({ guildId: guildDatabase.id, feature });
      }

      await guildDatabase.save();
    }
    // Users
    index = 0;
    for (const user of migrateUsers) {
      console.log(
        `Creating user ${user.id}... ${++index}/${migrateUsers.length}`
      );
      await User.upsert({ id: user.id });
      const userDatabase = await User.scope("default").findOne({
        where: { id: user.id }
      });

      if (!userDatabase) {
        console.log("Weird error #2");
        continue;
      }

      if (!userDatabase.donator)
        userDatabase.donator = await userDatabase.$create("donator", {});

      userDatabase.donator.nitroBoost = user.nitroBooster;
      userDatabase.donator.bonus = user.donatorBonus;

      for (const assignedTier of user.assignedTiers) {
        const tier = await PremiumTier.findOne({
          where: { name: assignedTier.tier }
        });
        if (!tier) {
          console.log(`Couldn't find tier ${tier} #3`);
          continue;
        }
        await AssignedTier.create({
          donatorId: userDatabase.donator.id,
          guildId: assignedTier.guild,
          premiumTierId: tier.id
        });
      }

      await userDatabase.donator.save();
      await userDatabase.save();
    }
  };

  // New Database
  const modelDir = path.join(__dirname, "models");

  const sequelize = new Sequelize({
    ...database,
    models: [modelDir],
    logging: false
  } as SequelizeOptions);

  sequelize.authenticate();
  console.log("New database successfully connected!");

  // Old Database
  mongoose
    .connect(
      config.database.mongoURI.replace(
        /%database%/gim,
        config.database.database
      ),
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
      }
    )
    .then(() => {
      console.log("Old database successfully connected!");
      startMigration();
    })
    .catch((err) => {
      console.log("Error while connecting to old database!");
      console.log(err);
    });
};

run();
