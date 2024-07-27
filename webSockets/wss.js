
const jwt = require("jsonwebtoken");
const { app } = require("./../app");
const http = require("http");
const server = http.createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
const users = require("./../Models/users");
const chats = require("./../Models/chats"); 
const { getFid } = require('./../Controllers/common');
const res = require("express/lib/response");
const { getFips } = require("crypto");





const allConnections = new Map();

wss.on("connection", async (ws, req) => {
  let lm = '';
  let lmt  = '';

  let myFriends;

 
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
  
    const user = await users.findOne({
      "friendsDetails._id": conId, // friendId is a placeholder for your actual friend's _id field name
      "friendsDetails.state": "connected",
      _id: userId,
    });

   console.log("this is user");
   console.log(user);
   console.log(conId);
   
    if (!user) {
      
      return ws.terminate();
    }
    if (user && userId) {
       myFriends = user.friends;
      console.log("hi",myFriends);
      ws.userId = userId;
      ws.rid = conId;
      allConnections.set(userId, ws);
      const onlineOnes = getOnlineFriends(myFriends);
      broadcastMessage(onlineOnes, { state: "Online" , id:userId });
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({onlineOnly:onlineOnes}));
      }
      
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
          console.log("hi")
     console.log(myFriends);

          try {
            const newChat = await chats.create(doc);
           if(newChat){
            ws.lm = newChat.content,
            ws.lmt = newChat.createdAt
           }

    
          
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
        } catch (error) {
          ws.terminate(); 
           return console.log(error)
        }
        }  
        else {
          return console.log("Not Authenicated");
        }
      });
    
    } else {
      ws.terminate(); // Close connection if authentication fails
    }
  
    ws.on("error", (err) => {
      console.error(`Error from ws.on error ${err}`);
    });

   
  
    ws.on("close", async () => {
      console.log(ws.readyState)
     console.log("closed");
      const onlineOnesAf = getOnlineFriends(myFriends);
      broadcastMessage(onlineOnesAf, { state: "Offline" , id:userId });
      
      const userId2 = getFid(conId , userId)
      console.log(userId2);
      console.log(userId);
     
     if(ws.lm){
      try {
        // Update the first document
        const user1 = await users.updateOne(
          { _id: userId, "friendsDetails._id": conId },
          { $set: { "friendsDetails.$.lastMsg": ws.lm, "friendsDetails.$.lastMsgTime": ws.lmt } }
        );
        // Update the second document
        const user2 = await users.updateOne(
          { _id: userId2, "friendsDetails._id": conId },
          { $set: { "friendsDetails.$.lastMsg": ws.lm, "friendsDetails.$.lastMsgTime": ws.lmt } }
        );
    
        if (user1.modifiedCount === 1 && user2.modifiedCount === 1) {
          console.log("Both documents updated successfully");
        } else {
          console.log("Error updating documents");
        }
      } catch (error) {
        console.error("Error updating documents:", error);
      }
     }
    
      console.log(ws.readyState)
  
      allConnections.delete(userId);

    });
  });




  function broadcastMessage(friendData, message) {
    friendData.forEach(friendId => {
      const ws = allConnections.get(friendId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Send your message here
        ws.send(JSON.stringify(message));
      }
    });
  }

  function getOnlineFriends(friendData) {
    const onlineFriends = [];
    friendData.forEach(friendId => {
      const ws = allConnections.get(friendId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        onlineFriends.push(friendId);
      }
    });
  
    return onlineFriends;
  }

  module.exports = { server };
