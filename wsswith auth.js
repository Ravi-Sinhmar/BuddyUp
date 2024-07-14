// Websockets Setup
const WS_PORT = process.env.WS_PORT;
const { json } = require("body-parser");
const { WebSocket, WebSocketServer } = require("ws");
const wss = new WebSocketServer({ port: WS_PORT });
const jwt = require("jsonwebtoken");
const chats = require("./../Models/chats");
const mongoose = require("mongoose");

const { map, all } = require("../app");
const users = require("../Models/users");

wss.on("listening", () => {
  console.log(`Web Sockets are listening on port ${WS_PORT}`);
});

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

wss.on("connection",async (ws, req) => {
  // Client side Authentication  and getting user _id --> userId
  function validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      return decoded.id; // Assuming the user ID is stored in the _id property
    } catch (err) {
      console.log(err);
    }
  }

  

  function extractTidAndFid(url) {
    // Split the URL after the "?" to get the query string
    const queryString = url.split("?")[1];
  
    if (!queryString) {
      // Handle case where there's no query string
      console.error("Invalid URL format: Missing query string");
      return { gtid: null, grid: null };
    }

    // Split the query string by "&" to get individual parameters
    const params = queryString.split("&");
    // Extract tid and fid values
    let gtid, grid;
    for (const param of params) {
      const [key, value] = param.split("=");
      if (key === "gtid") {
        gtid = value;
      } else if (key === "grid") {
        grid = value;
      }
    }
    return { gtid, grid };
  }
  

 
  const { gtid, grid } = extractTidAndFid(req.url);
  console.log("Extracted gtid:", gtid);
  console.log("Extracted grid:", grid);

  const userId = validateToken(gtid); // function defined above
  console.log("validated",userId);

  // let's validate if they are friends or not 
 // Checking if this person is in database or not
 let finalFid;
 let auth2 = false;
  const user = await users.find({
    _id: userId, // Ensure ObjectIds are casted properly
    friendsDetails: {
      $elemMatch: {
        _id: grid, // Cast rid to ObjectId
        state: "connected",
      },
    },
  });
if(user.length>0 && userId){

  gfid = getFid(grid, userId);
   auth2 = true;
   gfid=`${gfid}test`
  console.log("Autheniticate" , auth2,userId,gfid)
}

const gsid = userId;
console.log("gsid",gsid)

  // If validate then this code will execute ---->
  if (gsid && gfid) {
    // storing the socket of user by key as their userId (most imp: Even if this is the same id as user's sid when he/she is sending in every
    // message , but in this case we extracted from jwt tocken so  that user can't send our somebody else's id in msg and we store that , then
    // anybody can get anybody's chat , because sid or userId knon to everyone [for more info learn how jwt works])
    allConnections.set(gsid, ws);
    allConnections.set(gfid, gfid);
    
    
    ws.on("message", async (data) => {
      let dataObj = JSON.parse(data);
      console.log(dataObj);

      // Extracting data form msgs ->
      const content = dataObj.content;
      const rid = dataObj.rid;
      const sid = dataObj.sid;
      const fid = getFid(rid, sid);
      

      // Now we will varify that this user who sent us this msg is the same who we stored in map using thier tocket varification (if same then
      // send the recived msg to his/her friend whose id is in (fid -> frined id))

      // Firt if to check the valid sender id
      console.log(`Sid is ${sid}`);
      console.log(`fi is ${sid}`);
        if (allConnections.has(sid) && allConnections.get(fid) === `${fid}test`) {
          // Here we have checked that sender and revicer are authenicate friends (So store each msg in databse definetly)
// lets create document 
let doc = {
    chatId:rid,
    sid:sid,
    fid:fid,
    content:content
}

let newChat = await chats.create(doc);
console.log("created", newChat)

          //  2nd if to check weather reciver is present in connection or not
          if (allConnections.has(fid)) {
            console.log("In connections");
            const myws = allConnections.get(fid);
            if (myws.readyState === WebSocket.OPEN) {
              console.log("Your Friend is online send any msg ");
              myws.send(JSON.stringify({ content: content, senderId: sid }));
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
  console.log("before delettinon",allConnections.get(gfid));

  ws.on('close',()=>{
    allConnections.delete(gsid);
    allConnections.delete(gfid)
    console.log("Closed Connection and data deleted")
   
  })
});

module.exports = wss;
