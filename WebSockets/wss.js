// Websockets Setup
const WS_PORT = process.env.WS_PORT || 3000;

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: WS_PORT })
const jwt = require("jsonwebtoken");
const chats = require("./../Models/chats");
const mongoose = require("mongoose");
const users = require("../Models/users");

wss.on("listening", () => {
  console.log(`Web Sockets are listening on port ${WS_PORT}`);
});

let checkData = "default";
let count =0;

// Actually I have set the conversation id of any 2 users by combining their unique is so now in msg form client i get their unique id
// (sid -> sender id)  and the converstation id (rid -> room id) and getting the id of frined whom we want to send msg (fid -> friend id)

function getFid(rid, sid) {
  // Check if both rid and sid have the expected lengths
  if (rid.length !== 48 || sid.length !== 24) {
    return "Invalid input lengths. rid should be 48 characters, sid should be 24 characters.";
  }

  // Trim any leading or trailing spaces from rid and sid
  const trimmedRid = rid.trim();
  const trimmedSid = sid.trim();

  // Check if the first 24 characters of trimmedRid match trimmedSid
  if (trimmedRid.slice(0, 24) === trimmedSid) {
    return trimmedRid.slice(24); // Return remaining characters of rid
  } else if (trimmedRid.slice(-24) === trimmedSid) {
    // Check if last 24 characters of rid match sid
    return trimmedRid.slice(0, 24); // Return first 24 characters of rid
  } else {
    return "No matching FID found.";
  }
}

//   Global Varables
// Map to store ws object of every new user start entering in coonection (not specific in chat ), connection means if 20 user using our webiste then all have to store
// in map to make sure that when their friend text them , we can find him/her from all connected users (which may or may not be his/her friend but
// just using our website or platfrom (or specificly server))
const allConnections = new Map();

wss.on("connection", (ws, req) => {
  let countIn = 0;
  // Client side Authentication  and getting user _id --> userId
  function validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      return decoded.id; // Assuming the user ID is stored in the _id property
    } catch (err) {
      console.log(err);
    }
  }

  const token = req.url.split("?tid=")[1];
  const userId = validateToken(token); // function defined above

  console.log("This is joined time user id " , userId);

  // If validate then this code will execute ---->
  if (userId) {
    // storing the socket of user by key as their userId (most imp: Even if this is the same id as user's sid when he/she is sending in every
    // message , but in this case we extracted from jwt tocken so  that user can't send our somebody else's id in msg and we store that , then
    // anybody can get anybody's chat , because sid or userId knon to everyone [for more info learn how jwt works])


ws.userId = userId;
    allConnections.set(userId, ws);
    ws.on("message", async (data) => {
      let dataObj = JSON.parse(data);
    
      // Extracting data form msgs ->
      const content = dataObj.content;
      const rid = dataObj.rid;
      const sid = dataObj.sid;
      const rname = dataObj.rname;
      const sname = dataObj.sname
      const fid = getFid(rid, sid);
      
      console.log("this is chat id",rid);

      // Now we will varify that this user who sent us this msg is the same who we stored in map using thier tocket varification (if same then
      // send the recived msg to his/her friend whose id is in (fid -> frined id))

      // Checking Reciver id get in msg with reciver id get from db document

    
        // Firt if to check the valid sender id
        if (allConnections.has(sid)) {
          // Here we have checked that sender and revicer are authenicate friends (So store each msg in databse definetly)
// lets create document 
let doc = {
    chatId:rid,
    sid:sid,
    fid:fid,
    content:content,
    sname:sname,
    rname:rname 
}

const newChat =await chats.create(doc);
console.log(newChat)

          //  2nd if to check weather reciver is present in connection or not
          if (allConnections.has(fid)) {
            console.log("In connections");
            const myws = allConnections.get(fid);
            if (myws.readyState === WebSocket.OPEN) {
              console.log("Your Friend is online send any msg ");
              myws.send(JSON.stringify({ content: content, senderId: sid , sname:sname , rname:rname }));
            } else {
              console.log("May or may be online but connected");
            }
          } else {
            console.log("Not In coonection");
          }
        } else {
       return  console.log("Not Authenicated");
        }
      
    });
  } else {
    ws.terminate(); // Close connection if authentication fails
  }

  ws.on("error", (err) => {
    console.error(`Error from ws.on error ${err}`);
  });

  ws.on('close' , ()=>{
    console.log("this is close time userid",userId);
    allConnections.delete(userId);
  })
});

module.exports = wss;
