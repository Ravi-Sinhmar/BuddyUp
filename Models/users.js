const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  _id: {
    type: String, 
    required: true,
    
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
    default: "default.png",
  },
  bio: {
    type: String,
    default: "When You Lose Interest In Life, Life Shows Interest In You - The Story Of 777 Charlie",
  },
  friends: {
    type: Array,
    ref: "User", // Reference to User collection for each friend ID
  },
  friendsDetails: {
    type: [
      {
        state: {
          type: String,
          default: "sent",
        },
        name: {
          type: String,
          required: true,
        },
        profilePic: {
          type: String,
          default: "default.jpg",
        },
        _id: {
          type: String, // Optional: Reference to the chat document
          ref: "Chat",
        },
        lastMsg: {
          type: String, // Optional: Reference to the chat document
          default : "Start a Chat"
        },
        lastMsgTime: {
          type: String, // Optional: Reference to the chat document
          default : "Fri Jul 26 2024 01:50:44 GMT+0530 (India Standard Time)"
        },
      },
    ],
  },
});


module.exports = mongoose.model("User", userSchema);
