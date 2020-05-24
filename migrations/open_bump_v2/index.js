// Imports
const environment = process.argv.length >= 3 ? process.argv[2] : "production";
module.exports.environment = environment;

const Discord = require("discord.js");
const Guild = require("./models/Guild");
const User = require("./models/User");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const common = require("./utils/common");
const donator = require("./utils/donator");
const moment = require("moment");
const ms = require("ms");

// Prototype Changes (not recommended, but the most effective)
String.prototype.replaceAll = (str, search, replacement) => {
  return str && str.replace
    ? str.replace(new RegExp(search, "g"), replacement)
    : str;
};

Object.defineProperty(global, "__stack", {
  get: function () {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
      return stack;
    };
    var err = new Error();
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});

Object.defineProperty(global, "__line", {
  get: function () {
    return __stack[1].getLineNumber();
  }
});

Object.defineProperty(global, "__function", {
  get: function () {
    return __stack[1].getFunctionName();
  }
});

// Config
const config = require(`./config.${environment}.json`);
module.exports.config = config;

// Migration
const startMigration = () => {
  console.log("Starting migration...");
};

// Database
mongoose
  .connect(
    "".replaceAll(
      config.database.mongoURI,
      "%database%",
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
    console.log("Database successfully connected!");
    startMigration();
  })
  .catch((err) => {
    console.log("Error while connecting to database!");
    console.log(err);
  });
