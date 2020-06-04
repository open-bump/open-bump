const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");

const GuildSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: false
  },
  name_lower: {
    type: String,
    required: false
  },
  icon: {
    hash: {
      type: String,
      required: false
    },
    granted: {
      type: Boolean,
      required: true,
      default: false
    },
    informed: {
      type: Boolean,
      default: false
    }
  },
  bump: {
    description: {
      type: String,
      required: false
    },
    banner: {
      type: String,
      required: false
    },
    color: {
      type: Number,
      required: true,
      default: -1
    },
    invite: {
      type: String,
      required: false
    }
  },
  autoBump: {
    type: Boolean,
    required: true,
    default: false
  },
  settings: {
    prefix: {
      type: String,
      required: false
    }
  },
  feed: {
    type: String,
    required: false
  },
  lastBump: {
    user: {
      type: String,
      required: false
    },
    time: {
      type: Date,
      required: false
    }
  },
  bumps: {
    type: Number,
    required: true,
    default: 0
  },
  features: {
    type: Array,
    required: true,
    default: []
  },
  donators: {
    // {
    // id: '422373229278003231',
    // tier:
    // }
    type: Array,
    required: true,
    default: []
  }
});

GuildSchema.plugin(findOrCreate);

const Guild = mongoose.model("Guild", GuildSchema);

module.exports = Guild;
