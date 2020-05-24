// Imports
export const environment_ = "production";

const Guild = require("./oldmodels/Guild");
const User = require("./oldmodels/User");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const common = require("./utils/common");
const donator = require("./utils/donator");
const moment = require("moment");
import path from "path";
import { Sequelize, SequelizeOptions } from "sequelize-typescript";
import * as database from "./database.json";
const ms = require("ms");

const run = async () => {
  // Config
  const config = require(`./config.${environment_}.json`);
  module.exports.config = config;

  // Migration
  const startMigration = async () => {
    console.log("Starting migration...");
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
