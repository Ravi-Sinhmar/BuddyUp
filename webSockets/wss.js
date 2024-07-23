
const jwt = require("jsonwebtoken");
const { app } = require("./../app");
const http = require("http");
const server = http.createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
const users = require("./../Models/users");
const chats = require("./../Models/chats"); 
const { getFid } = require('./../Controllers/common');
const allConnections = new Map();
wss.on("connection", async (ws, req) => {
    function validateToken(token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        return decoded.id;
      } catch (err) {
        console.log(err);
      }
    }
  
    const parts = req.url.split("?tid=")[1];
    const token = parts.split("&rid=")[0];
    const conId = parts.split("&rid=")[1];
    console.log(token);
    console.log(conId);
    const userId = validateToken(token); // function defined above
    const user = await users.find({
      "friendsDetails._id": conId, // friendId is a placeholder for your actual friend's _id field name
      "friendsDetails.state": "connected",
      _id: userId,
    });
    if (!user) {
      return ws.terminate();
    }
    if (user && userId) {
      ws.userId = userId;
      ws.rid = conId;
      allConnections.set(userId, ws);
      ws.on("message", async (data) => {
        console.log(`Received message => ${data}`);
        let dataObj = JSON.parse(data);
        // Extracting data form msgs ->
        const content = dataObj.content;
        const rid = dataObj.rid;
        let sid = dataObj.sid;
        const rname = dataObj.rname;
        const sname = dataObj.sname;
        const fid = getFid(rid, sid);
        console.log("this is chat id", rid);
  
        if (allConnections.has(sid) && conId === rid) {
          console.log("this is rid and conId bellow ");
          console.log(conId);
          console.log(rid);
  
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
  
            if (myws.readyState === WebSocket.OPEN && myws.rid === rid) {
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
      console.log("I am out");
      console.log("this is close time userid", userId);
      allConnections.delete(userId);
    });
  });

  module.exports = { server };
