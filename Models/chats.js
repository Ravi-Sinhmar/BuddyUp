const { type } = require('express/lib/response');
const mongoose = require('mongoose');
const chatSchema = new mongoose.Schema({
  chatId: {
    type: String, // Can be a string or an ObjectId (choose based on your needs)
    required: true,
  },
  sid: {
    type: String,
    required: true,
    ref: 'User', // Reference to the User who sent the message
  },
  sname:{
    type:String,
  },
  fid: {
    type: String,
    required: true,
    ref: 'User', // Reference to the User who received the message
  },
  rname:{
    type:String,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default:  Date.now,
  },
});

// Create indexes for efficient querying
chatSchema.index({ chatId: 1 }); // Index on chatId for faster retrieval
chatSchema.index({ createdAt: -1 }); // Index on createdAt for sorting (descending)

module.exports = mongoose.model('Chat', chatSchema);
