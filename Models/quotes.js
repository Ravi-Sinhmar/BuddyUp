const { type } = require('express/lib/response');
const mongoose = require('mongoose');
const quoteSchema = new mongoose.Schema({
  wId: {
    type: String,
    required: true,
    ref: 'User', // Reference to the User who sent the message
  },
  wName:{
    type:String,
    required: true,
  },
   wPic:{
    type:String,
    required: true,
  },
  quote: {
    type: String,
    required: true,
  },
 
  createdAt: {
    type: Date,
    default: Date.now, // Timestamp of chat creation
  },
});

module.exports = mongoose.model('Quote', quoteSchema);
