const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");

const ApplicationSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: true,
    index: {
      unique: true,
      dropDups: true
    }
  },
  owner: {
    type: String,
    required: true
  },
  bot: {
    type: String,
    required: false
  },
  token: {
    type: String,
    required: true,
    default: mongoose.Types.ObjectId,
    index: {
      unique: true,
      dropDups: true
    }
  },
  created: {
    type: Date,
    required: true,
    default: Date.now
  },
  scopes: {
    type: Array,
    required: true,
    default: []
  }
});

ApplicationSchema.plugin(findOrCreate);

const Application = mongoose.model("Application", ApplicationSchema);

module.exports = Application;
