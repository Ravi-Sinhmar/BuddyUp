const jwt = require("jsonwebtoken");
const chats = require("./../Models/chats");
const mongoose = require("mongoose");
const users = require("../Models/users");
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
const allConnections = new Map();
const wsHandler = (ws, req) => {
  let countIn = 0;
  
  function validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      return decoded.id; 
    } catch (err) {
      console.log(err);
    }
  }

  const token = req.url.split("?tid=")[1];
  const userId = validateToken(token); // function defined above

  console.log("This is joined time user id ", userId);


  if (userId) {
    
    ws.userId = userId;
    allConnections.set(userId, ws);
    ws.on("message", async (data) => {
      console.log(`Received message => ${data}`);

      let dataObj = JSON.parse(data);

      // Extracting data form msgs ->
      const content = dataObj.content;
      const rid = dataObj.rid;
      const sid = dataObj.sid;
      const rname = dataObj.rname;
      const sname = dataObj.sname;
      const fid = getFid(rid, sid);

      console.log("this is chat id", rid);

     
      if (allConnections.has(sid)) {
      
        let doc = {
          chatId: rid,
          sid: sid,
          fid: fid,
          content: content,
          sname: sname,
          rname: rname,
        };
        const newChat = await chats.create(doc);
        console.log(newChat);

        //  2nd if to check weather reciver is present in connection or not
        if (allConnections.has(fid)) {
          console.log("In connections");
          const myws = allConnections.get(fid);
          if (myws.readyState === WebSocket.OPEN) {
            console.log("Your Friend is online send any msg ");
            myws.send(
              JSON.stringify({
                content: content,
                senderId: sid,
                sname: sname,
                rname: rname,
              })
            );
          } else {
            console.log("May or may be online but connected");
          }
        } else {
          console.log("Not In coonection");
        }
      } else {
        return console.log("Not Authenicated");
      }
    });
  } else {
    ws.terminate(); // Close connection if authentication fails
  }

  ws.on("error", (err) => {
    console.error(`Error from ws.on error ${err}`);
  });

  ws.on("close", () => {
    console.log("this is close time userid", userId);
    allConnections.delete(userId);
  });
};

module.exports = wsHandler;
