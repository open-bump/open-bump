const mongoose = require('mongoose')
const findOrCreate = require('mongoose-findorcreate')

const UserSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  donator: {
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    transition: {
      amount: {
        type: Number,
        required: false
      },
      detected: {
        type: Date,
        required: false
      },
      informed: {
        type: Boolean,
        required: false
      }
    },
    assigned: {
      // {
      //   id: 561984986274725900,
      //   tier: 103
      // }
      type: Array,
      required: true,
      default: []
    }
  }
})

UserSchema.plugin(findOrCreate)

const User = mongoose.model('User', UserSchema)

module.exports = User
