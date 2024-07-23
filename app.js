
// Node.js Core Moudles
const path = require("path");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const ejsLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");


const express = require("express");
const http = require('http');
const app = express();
const server = http.createServer(app);



// Database Models (Total 2 -> users , chats(Used Indexing here))
const users = require("./Models/users");
const chats = require("./Models/chats");
const quotes = require("./Models/quotes");

// Middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Templating Engin setup -> For Sending Dynamic Data on pages without reload of Page
app.use(ejsLayouts);
app.set("layout", "./layouts/main");
app.set("view engine", "ejs");
// Importing custom Modules (Controllers),Controllers are simple function to do a tasks but defined in other file and using here
const userRoutes = require("./Routes/userRoutes");
app.use(userRoutes);

// Importing custom Middlewares
const cookieAuth = require("./Middlewares/auth");
const checkCookies = require("./Middlewares/checkCookies");
const setCookies = require("./Controllers/setCookies");
const getTimeDifference = require('./Controllers/timeDecoder');





const WebSocket = require("ws");
const { status, type } = require("express/lib/response");
const { rmSync } = require("fs");


const wss = new WebSocket.Server({ server });



function getFid(rid , sid) {
  if (typeof rid !== "string" && typeof sid !== "string") {
    return { error: "Invalid input: combinedString must be a string" };
  }

  const parts = rid.split('-');

  if (parts.length !== 2) {
    return { error: "Invalid format: expected a single hyphen in the combined string" };
  }

  if(parts[0] === sid){
    return parts[1]
  }
  else if (parts[1]=== sid){
    return parts[0]
  }

}


const allConnections = new Map();
wss.on("connection",async(ws, req) => {
 
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
  console.log(token)
  console.log(conId);
  const userId = validateToken(token); // function defined above
  const user = await users.find({
  'friendsDetails._id': conId, // friendId is a placeholder for your actual friend's _id field name
  'friendsDetails.state': "connected", 
  '_id':userId,
});
if(!user){
  return  ws.terminate();
}
  if(user && userId){
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
console.log(conId) ;
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
})



// Route 1 , /
app.get("/", (req, res) => {
  
  if (req.cookies.token && req.uid) {
    return res.status(301).redirect("messages");
  }
  res.render("welcome", { title: "Welcome" });
});


// Register
app.get("/register",checkCookies, (req, res) => {
  if (req.cookies.token && req.uid && req.uid.length != 24) {
    return res.status(301).redirect("messages");
  }
 res.status(200).render('register',{title:"Register"});
});

app.get('/registerc', async(req, res) => {
  const { username } = req.query;
   console.log(username);
  // Query your database (pseudo-code)
  try {
    const userExists = await users.findById(username);
console.log(userExists);
 if(!userExists){
  res.status(200).json({status:'success'})
 }
 else{
  res.status(404).json({status:"fail"});
 }
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: "500",
    });
  }

});


app.post("/register", async (req, res) => {
console.log("it is here");
  try {
    const user = await users.create(req.body);
    if (!user) {
      return res.status(500).render('resultBox',
      {
        title:"Failed",
        type:"500",
        status:"Try Again",
        message:"We Encountered a Problem with Your Registration",
        href:"/register"
      }
    )
    }
    const token = setCookies(user); // Generate token
    res.cookie("token", token, { httpOnly: true }); // Set cookie after token generation
    res.status(201).render("resultBox", {
      title: "Success",
      type:"success",
      status: "Success",
      message:
        "You have registerd successfully",
         href :'/profile/edit',
    });
  } catch (error) {
    return res.status(500).render('resultBox',
      {
        title:"Failed",
        type:"500",
        status:"Try Again",
        message:"We Encountered a Problem with Your Registration",
        href:"/register"
      }
    )
  }
});

// Login

app.get("/login", checkCookies, (req, res) => {
  if (req.cookies.token && req.uid && req.uid.length != 24) {
    return res.status(301).redirect("messages");
  }
  return res.render("login", { title: "Login" });
});

app.post("/login", checkCookies, async (req, res) => {
  if (!req.body.uniqueId || !req.body.password) {
    return res.status(404).render('resultBox',
      {
        title:"Failed",
        type:"fail",
        status:"Failed",
        message:"Looks Like You Missed Something: Review your fields again",
        href:"/login"
      }
    )
  }

  const uid = req.body.uniqueId;
  const password = req.body.password;

  try {
    const user = await users.findById({ _id: uid, password: password });
     console.log(user);
    if (!user) {
      return res.status(404).render('resultBox',
        {
          title:"Not Found",
          type:"fail",
          status:"Not Found",
          message:"Looks like you don't have an account yet. Sign up for free",
          href:"/register"
        }
      )
    }
    const token = setCookies(user); // Generate token
    console.log(token);
    res.cookie("token", token, { httpOnly: true }); // Set cookie after token generation
    return res.status(404).render('resultBox',
      {
        title:"Success",
        type:"success",
        status:"Sucess",
        message:`Welcome Back,${user.name}`,
        href:"/messages"
      }
    )
  } catch (error) {
    return res.status(500).render('resultBox',
      {
        title:"Failed",
        type:"500",
        status:"Try Again",
        message:"We Encountered a Problem with Your Login",
        href:"/login"
      }
    )
  }
});

app.get('/quotes/:uid',cookieAuth,async(req,res)=>{
  const myPic = req.profilePic;
  const myId = req.id;
  const uid = req.params.uid;

  if(myId === uid){
    return res.status(200).redirect('/yourQuotes');
  }
  console.log(myId)
  try {
    const data = await quotes.find({wId:uid});
    console.log("your quotes");
    const allQuotes = data.map((qData) => ({
      wName: qData.wName,
      wPic: qData.wPic,
      wId: qData.wId , // Set default if profilePic is missing
      qId: qData._id,
      quote : qData.quote, 
      likes: qData.likes,
      time : getTimeDifference(qData.createdAt)
    }));
    res.render('quotes.ejs',{title:"Quotes",allQuotes,myPic,myId,navHead:"User Quotes",});
  } catch (error) {
    return res.status(500).render('resultBox',
      {
        title:"Failed",
        type:"500",
        status:"Try Again",
        message:"We Encountered a Problem with showing Posts",
        href:"/quotes"
      }
    )
  }
});



app.get('/yourQuotes',cookieAuth,async(req,res)=>{
  const myPic = req.profilePic;
  const myId = req.id;
  console.log(myId)
  try {
    const data = await quotes.find({wId:myId});
    const allQuotes = data.map((qData) => ({
      wName: qData.wName,
      wPic: qData.wPic,
      wId: qData.wId , // Set default if profilePic is missing
      qId: qData._id,
      quote : qData.quote,
       likes:qData.likes,
      time : getTimeDifference(qData.createdAt),
      
    }));
     
    res.render('quotes.ejs',{title:"Your Quotes",allQuotes,myPic,myId,navHead:"Your Quotes"});
  } catch (error) {
    return res.status(500).render('resultBox',
      {
        title:"Failed",
        type:"500",
        status:"Try Again",
        message:"We Encountered a Problem with showing Posts",
        href:"/profile"
      }
    )
  
  }


});
app.get('/quotes',cookieAuth,async(req,res)=>{
  const myPic = req.profilePic;
  const myId = req.id;
  try {
    const data = await quotes.find({});
    const allQuotes = data.map((qData) => ({
      wName: qData.wName,
      wPic: qData.wPic,
      wId: qData.wId , // Set default if profilePic is missing
      qId: qData._id,
      quote : qData.quote, 
      likes:qData.likes,
      time : getTimeDifference(qData.createdAt)
    }));

    res.render('quotes.ejs',{title:"Quotes",allQuotes,myPic,myId,navHead:"All quotes"});

  } catch (error) {
    return res.status(500).render('resultBox',
      {
        title:"Failed",
        type:"500",
        status:"Try Again",
        message:"We Encountered a Problem with showing Posts",
        href:"/messages"
      }
    )
  
  }


});



app.patch('/quotes',cookieAuth,async(req,res)=>{
const wId = req.id;
const wName = req.name;
const wPic = req.profilePic;
const quote = req.body.quote;
try {
  const result =await quotes.create({wId ,wName,wPic,quote})
console.log(result);
if(result){
  res.status(201).json({status:'success',message:'Created'})
}
  
} catch (error) {
  res.status(404).json({status:'fail',message:'500'})

}

});


// Page 1 , Route '/register' , Get , Serving register.ejs File  [No Auth EveryOne can Access , if auth then send to /messages]
app.get("/users/:uid", cookieAuth, async (req, res) => {
  let uid = req.params.uid;
  const myId = req.id;
  if(uid.includes('-')){
    let fid  = extractString(uid,myId);
    uid = fid[0];
  }
 
  if(uid === req.id){
  return res.redirect('/profile');
  }
  try {
    const user = await users.findById(uid);
 console.log(user);

    if (!user) {
      return res.status(404).render('resultBox',
        {
          title:"Failed",
          type:"fail",
          status:"Failed",
          message:"Looks like your friend don't have an account yet. Ask him/her to Sign up first",
          href:"/messages"
        }
      )
    }

    const user2 = await users.findById(myId);
    if (!user2) {
      return res.status(500).render('resultBox',
        {
          title:"Failed",
          type:"500",
          status:"Try Again",
          message:"We Encountered a Problem with showing profile",
          href:"/messages"
        }
      )
    }
let mstate = 'unset'
user2.friendsDetails.forEach(el=>{
  if(el._id === `${myId}-${uid}` || el._id === `${uid}-${myId}`){
    console.log(myId);
    console.log(uid);
    mstate = el.state;
   return console.log("this is mstate",mstate)

    }
});
    const { _id: id, name, profilePic, bio, } = user;
let fstate = 'unset';
let rid = ''
   user.friendsDetails.forEach(el =>{
if(el._id === `${myId}-${uid}` || el._id === `${uid}-${myId}`){
fstate = el.state;
rid = el._id;
console.log(myId);
console.log(uid);
return console.log("this is fstate",fstate);
}
    });

if(fstate === 'blocked'){
  return res.status(200).render('resultBox',
    {
      title:"Failed",
      type:"fail",
      status:"Blocked",
      message:"Your are blocked by that person",
      href:"/messages"
    }
  )
}




    let title = `${name}-Profile`;
    res.status(200).render("otherProfile", { id, name, profilePic, bio, title,fstate,mstate,rid});
  } catch (error) {
    return res.status(500).render('resultBox',
      {
        title:"Failed",
        type:"500",
        status:"Try Again",
        message:"We Encountered a Problem with showing profile",
        href:"/messages"
      }
    )
  }
});

app.get("/profile", cookieAuth, (req, res) => {
  const uid = req.id;
  const name = req.name;
  const profilePic = req.profilePic;
  const bio = req.bio;
  const myPic = req.profilePic;

  res.status(200).render("profile", {
    title: "My Profile",
    name: name,
    uid: uid,
    myPic: myPic,
    bio: bio,
    blcount: "0",

  });
});

app.get("/profile/edit",cookieAuth, (req, res) => {
  const { name, profilePic, bio } = req;
  res
    .status(200)
    .render("editProfile", { title: "Edit", name, profilePic, bio });
});

app.patch("/profile/edit", cookieAuth, async (req, res) => {
  const uid = req.id;
  const { name, bio , profilePic } = req.body;
  try {
    const user = await users.findOneAndUpdate(
      { _id: uid },
      { $set: { name: name, bio: bio , profilePic: profilePic } },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ status:'fail',message:'Not Updated' });
    }
    const token = setCookies(user); // Generate token
    res.cookie("token", token, { httpOnly: true }); // Set cookie after token generation
    res.status(201).json({ status: "success", message: "Updated" });
  } catch (err) {
    res.status(500).json({
      status:"fail",
      message:"500"
    })
  }
});


// Page 3 , Register -> Post at /register
app.get("/messages", cookieAuth, async (req, res) => {
  const userId = req.id;
  const myPic = req.profilePic;
  try {
    console.log(userId);
    const user = await users.findById(userId);
    if (!user) {
    return res.status(404).redirect("/register");
    }
    const friendData = user.friendsDetails.map((friend) => ({
      state: friend.state,
      name: friend.name,
      profilePic: friend.profilePic || "default.png", // Set default if profilePic is missing
      chatId: friend._id,
    })); // Create an array of friend objects with only name and profilePic

let custom = 'show';
let allMsg = 'hidden';

friendData.some(el => {
  if (el.state === 'connected') {
    custom = 'hidden';
    allMsg = 'show';
    return true; // Break the loop
  }
  return false; // Continue to the next element
});
  


    return res.status(200).render("messages", { friendData, title: "Messages", myPic,custom,allMsg });
  } catch (error) {
    return res.status(500).render('resultBox',
      {
        title:"Failed",
        type:"500",
        status:"Try Again",
        message:"We Encountered a Problem, Plese try after some time",
        href:"/register"
      }
    )  }

  // res.render("share" , {title:"Messages"});
});

app.patch("/requests/:id", cookieAuth, async (req, res) => {
  const uid = req.id;
  const receiverId = req.params.id;
if(uid === receiverId){
  return res.status(200).json({
    status:'alert',
    message:'yourself'
  })
}
  
  const senderData = {
    state: "received",
    name: req.name,
    profilePic: req.profilePic,
    _id: `${uid}-${receiverId}`,
  };
  try {
    let count = 0;
    const userReceiver = await users.findOneAndUpdate(
      {_id:receiverId, friends:{$nin:[uid]}},
      { $addToSet: { friends: uid, friendsDetails: senderData } },
      { new: true } // Include this option
    );
 
    if (userReceiver) {
     count++
console.log(count)
const receiverData = {
  state:"sent",
  name:userReceiver.name,
  profilePic:userReceiver.profilePic,
  _id:`${uid}-${receiverId}`,
}

     const userSender = await users.updateOne(
      {_id:uid, friends:{$nin:[receiverId]}},
      { $addToSet: { friends: receiverId, friendsDetails: receiverData } },
      { new: true } // Include this option
    );
    if(userSender){
      count++;
      if(count === 2){
        res.status(201).json({
          status:'success',
          message:'Request Sent'
        })
      }
    }else{

      const afterPull = await users.findOneAndUpdate(
        {_id:receiverId},
        { $pull: { friends: uid, friendsDetails: senderData } },
        { new: true } // Include this option
      );
      if(afterPull){
        res.status(404).json({
          status:"fail",
          message:"Try Again"
        })
      }


    }
   
    }
    else{
      res.status(400).json({
        status:'alert',
        message:'already sent'
      })
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({
      status:'fail',
      message:'500'
    })
  }
});

// Page 3 , Register -> Post at /register
app.get("/requests", cookieAuth, async (req, res) => {
  const userId = req.id;
  const myPic = req.profilePic;
  try {
    console.log(userId);
    const user = await users.findById(userId);
    console.log(user);
    if (!user) {
      return res.status(500).render('resultBox',
        {
          title:"Not Found",
          type:"fail",
          status:"Try Again",
          message:"We Encountered a Problem,Please try after some time ",
          href:"/register"
        }
      )
    }
    const friendData = user.friendsDetails.map((friend) => ({
      state: friend.state,
      name: friend.name,
      profilePic: friend.profilePic, // Set default if profilePic is missing
      chatId: friend._id,
    })); // Create an array of friend objects with only name and profilePic

    let sCustom = 'show';
    let rCustom = 'show';
    let sSection = 'hidden';
    let rSection = 'hidden';
    
    friendData.forEach(el => {
      if (el.state === 'sent') {
        sCustom = 'hidden';
        sSection = 'show';
      }
      if(el.state === 'received'){
        rCustom = 'hidden'
        rSection = 'show'
      }
      if(sCustom === 'hidden' && rCustom === 'hidden'){
        return true;
      }
      else{
        return false; // Continue to the next element
      }
     
    });


    res.status(200).render("requests", {
       friendData,
        title: "Requests",
        myPic,
        rCustom,
        sCustom,
        sSection,
        rSection
      
       });
  } catch (error) {
    return res.status(500).render('resultBox',
      {
        title:"Failed",
        type:"500",
        status:"Try Again",
        message:"We Encountered a Problem, Plese try after some time",
        href:"/register"
      }
    ) 
    
  }
 
});


app.patch("/requests/accept/:rid", async (req, res) => {
  console.log("accept/:userId , Patch");
  const userId = req.params.rid;
  try {
    const result = await users.updateMany(
      { "friendsDetails._id": { $in: [userId] } },
      { $set: { "friendsDetails.$[friend].state": "connected" } },
      { arrayFilters: [{ "friend._id": userId }] }
    );
  
    if(result.modifiedCount === 2){
      res.status(200).json({
        status:'success',
        message:"accepted"
      })
    }
  } catch (error) {
    res.status(500).json({status:'fail',messages:'500'})
  }

});

function extractString(combinedString) {
  if (typeof combinedString !== "string") {
    console.log("Either id is not string");
    return null; // Or handle the error as needed
  }

  const parts = combinedString.split('-');

  if (parts.length !== 2) {
    console.log("Invalid format: Expected two parts separated by a hyphen");
    return null; // Or handle the error as needed
  }

  const [str1, str2] = parts;

  return [str1, str2];
}

app.get("/blockedUsers", cookieAuth, async (req, res) => {
  const uid = req.id;
  const myPic = req.profilePic;
  try {
   
    console.log(uid);
    const user = await users.findById(uid);
    console.log(user);
    if (!user) {
      return res.status(404).render('resultBox',
        {
          title:"Failed",
          type:"500",
          status:"Try Again",
          message:"We Encountered a Problem, Plese try after some time",
          href:"/register"
        }
      ) 
    }


    const friendData = user.friendsDetails.map((friend) => ({
      state: friend.state,
      name: friend.name,
      profilePic: friend.profilePic,
      chatId: friend._id,
      
    }));
  
    res.status(200).render("blocked", { title: "Blocked", friendData, myPic });
  } catch (err) {
    return res.status(500).render('resultBox',
      {
        title:"Failed",
        type:"500",
        status:"Try Again",
        message:"We Encountered a Problem, Plese try after some time",
        href:"/register"
      }
    ) 
  }
});
app.patch("/unblock",cookieAuth,async(req,res)=>{
  const chatId = req.body.chatId;
console.log(chatId);
try {
  const user = await users.updateOne(
    { _id: req.id, "friendsDetails._id": chatId }, // Filter by both user ID and chat ID
    { $set: { "friendsDetails.$.state": "connected" } } // Update state using positional operator
  );
  
  if(user.modifiedCount === 1){
    console.log("done");
    res.status(200).json({status:'success',message:"unblock"})
  }
  
  
} catch (error) {
  
  res.status(500).json({status:'fail',message:'500'});
}

});

app.patch("/block",cookieAuth,async(req,res)=>{
  const chatId = req.body.chatId;
console.log(chatId);
try {
  
  const user = await users.updateOne(
    { _id: req.id, "friendsDetails._id": chatId }, // Filter by both user ID and chat ID
    { $set: { "friendsDetails.$.state": "blocked" } } // Update state using positional operator
  );
  
  if(user.modifiedCount === 1){
    console.log("done");
    res.status(200).json({status:'success',message:"blocked"})
  }
} catch (error) {
  res.status(500).json({status:'fail',message:"500"})
}



});

// Logout User
app.get("/logout", cookieAuth, (req, res) => {
  if (req.id) {
    res.clearCookie("token");
    return res.status(200).json({
      status: "success",
      messsage: "Your are successfully logged out",
    });
  }
});

// Deleting account
app.delete("/delete", cookieAuth, async (req, res) => {
  const uid = req.id;
  try {
    const result = await users.deleteOne({ _id: uid });
    console.log(result.deletedCount);
    if (result.deletedCount === 1) {
      res.clearCookie("token");
      res.status(200).json({
        status: "success",
        message: "Your Account has been deleted permanently",
      });
    } else {
      res.status(404).json({
        status: "fail",
        message: "Try Again",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: "500",
    });
  }
});

app.delete("/requests/delete/:rid", async (req, res) => {
  const userId = req.params.rid;
  console.log("delete");
  console.log(userId);

 

  const data = extractString(userId);
  try {
    const result = await users.updateMany(
      { "friendsDetails._id": userId }, // Target documents with matching _id in friendsDetails
      {
        $pull: {
          // Remove elements from arrays
          friendsDetails: { _id: userId }, // Remove object from friendsDetails
          friends: { $in: data }, // Remove specific strings from friends array
        },
      }
    );

    console.log("Updated", result.modifiedCount, "documents.");

    if (result.modifiedCount == 2) {
      return res.status(200).json({
        status:'success',
        message: "deleted",
      });
    } else {
      res.status(404).json({
        status:'fail',
        message: "not deleted",
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "500",
    });
  }

});

app.delete("/requests/remove/:rid", async (req, res) => {
  const userId = req.params.rid;
  console.log("remove");
  console.log(userId);


  const data = extractString(userId);
  try {
    const result = await users.updateMany(
      { "friendsDetails._id": userId }, // Target documents with matching _id in friendsDetails
      {
        $pull: {
          // Remove elements from arrays
          friendsDetails: { _id: userId }, // Remove object from friendsDetails
          friends: { $in: data }, // Remove specific strings from friends array
        },
      }
    );

    console.log("Updated", result.modifiedCount, "documents.");

    if (result.modifiedCount == 2) {
      return res.status(200).json({
        status:'success',
        message: "removed",
      });
    } else {
      res.status(404).json({
        status:'fail',
        message: "not removed",
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "500",
    });
  }

});

app.get("/messages/:chatId",cookieAuth, async (req, res) => {
  tid = req.cookies.token;
  const chatId = req.params.chatId;
  const chatIds = extractString(chatId);
  const toId = getFid(chatId,req.id);
  if (chatIds[0] === req.id || chatIds[1] === req.id) {
    try {
      // Fetching Chats
      const limit = 20; // Number of messages to fetch per request
      let skip = 0;
      const messages = await chats
        .find({ chatId })
        .sort({ createdAt: 1 }) // Sort by createdAt descending
        .skip(skip) // Skip the first 'skip' number of documents
        .limit(limit); // Limit the number of returned documents

      const formattedMessages = messages.map((message) => ({
        sid: message.sid,
        fid: message.fid,
        rname:message.rname,
        chatId: message.chatId,
        content: message.content,
        _id: message._id.toString(), // Convert ObjectId to string
        time: message.createdAt.toLocaleString(), // Format time for display
      }));
      // console.log(formattedMessages)
      return res.render("chat", {
        message: formattedMessages,
        chatId,
        userId: req.id,
        userName: req.name,
        tid,
        title: `Chats`,
        toId,
      });
    } catch (error) {
      return res.status(500).render('resultBox',
        {
          title:"Failed",
          type:"500",
          status:"Try Again",
          message:"We Encountered a Problem, Plese try after some time",
          href:"/messages"
        }
      ) 
  
    }
  } else {
    return res.status(404).render('resultBox',
      {
        title:"Failed",
        type:"fail",
        status:"Not Found",
        message:"Chats not found",
        href:"/messages"
      }
    ) 
  }
});
module.exports = { server , app}