const { type } = require('express/lib/response');
const mongoose = require('mongoose');
const quoteSchema = new mongoose.Schema({
//   quoteId: {
//     type: String, // Can be a string or an ObjectId (choose based on your needs)
//     required: true,
//   },
  wId: {
    type: String,
    required: true,
    ref: 'User', // Reference to the User who sent the message
  },
  wName:{
    type:String,
    required: true,
  }, wPic:{
    type:String,
    required: true,
  },
  quote: {
    type: String,
    required: true,
  },
  qPic: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    required: true,
    default:0
  },
  createdAt: {
    type: Date,
    default: Date.now, // Timestamp of chat creation
  },
});

// Create indexes for efficient querying
// quoteSchema.index({ quoteId: 1 }); // Index on chatId for faster retrieval
// quoteSchema.index({ createdAt: -1 }); // Index on createdAt for sorting (descending)

module.exports = mongoose.model('Quote', quoteSchema);
