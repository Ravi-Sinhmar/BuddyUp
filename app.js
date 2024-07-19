
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




const WebSocket = require("ws");


const wss = new WebSocket.Server({ server });

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
wss.on("connection", (ws, req) => {
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
})


// Route 1 , /
app.get("/",checkCookies, (req, res) => {
  if (req.cookies.token && req.uid) {
    return res.status(301).redirect("messages");
  }
  res.render("welcome.ejs", { title: "Welcome" });
});


// Route 2 , /register
app.get("/register",checkCookies, (req, res) => {
  if (req.cookies.token && req.uid) {
    return res.status(301).redirect("messages");
  }
  return res.status(200).render("register", {
    title: "Register",
    status: "Success",
    message:
      "You have registerd successfully & this is you UID which you can see on profile section",
    icon: "success.png",
    right: "Continue",
    uid: "tempUID",
  });
});


app.get('/quotes',cookieAuth,async(req,res)=>{
  const myPic = req.profilePic;
  try {
    const data = await quotes.find({});
    const allQuotes = data.map((qData) => ({
      wName: qData.wName,
      wPic: qData.wPic,
      wId: qData.wId , // Set default if profilePic is missing
      qId: qData._id,
      qPic: qData.qPic,
      quote : qData.quote,
      likes:qData.likes
    }));

    res.render('quotes.ejs',{title:"Quotes",allQuotes,myPic});

  } catch (error) {
    console.log(error)
  
  }


});

app.patch('/quotes',cookieAuth,async(req,res)=>{
const wId = req.id;
const wName = req.name;
const wPic = req.profilePic;
const qPic = req.body.qPic;
const likes = 0;
const quote = req.body.quote;
const result =await quotes.create({wId ,wName,wPic,likes,quote,qPic})
console.log(result);
if(result){
  res.status(201).json({status:'success',message:'Created'})
}

});


app.get('/q',cookieAuth,(req,res)=>{
  const myPic = req.profilePic
res.render('quoteInput.ejs',{title:"Quotes",myPic});
});


app.post("/register", async (req, res) => {
  try {
    const user = await users.create(req.body);
    if (!user) {
      return res.status(400).json({ message: "Registration failed" });
    }
    const token = setCookies(user); // Generate token
    res.cookie("token", token, { httpOnly: true }); // Set cookie after token generation
    res.status(201).render("status", {
      title: "Success",
      status: "Success",
      message:
        "You have registerd successfully & this is you UID which you can see on profile section",
      icon: "success.png",
      left: "hidden",
      right: "Continue",
      uid: user._id,
      href :'/profile/edit',
      bg:'bg-blf'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Page 1 , Route '/register' , Get , Serving register.ejs File  [No Auth EveryOne can Access , if auth then send to /messages]
app.get("/login", checkCookies, (req, res) => {
  if (req.cookies.token && req.uid) {
    return res.status(301).redirect("messages");
  }
  return res.render("login", { title: "Login" });
});

app.post("/login", checkCookies, async (req, res) => {
  if (!req.body.uniqueId || !req.body.password) {
    return res.status(404).render("status", {
      title: "Fail",
      status: "Wrong Information",
      message: "Please provide valid information to login",
      icon: "404.png",
      left: "hidden",
      right: "Try Again",
      href: "/login",
      bg:'bg-ble'
    });
  }
  const uid = req.body.uniqueId;
  const password = req.body.password;

  try {
    const user = await users.find({ _id: uid, password: password });

    if (!user) {
      return res.status(404).render("status", {
        title: "Fail",
        status: "Wrong Information",
        message: "Please provide valid information to login",
        icon: "404.png",
        left: "hidden",
        right: "Try Again",
        href: "/login",
        bg:'bg-ble'
      });
    }
    const token = setCookies(user[0]); // Generate token
    console.log(token);
    res.cookie("token", token, { httpOnly: true }); // Set cookie after token generation
    res.status(201).render("status", {
      title: "Success",
      status: "Success",
      message: "You have loggedIn successfully.",
      icon: "success.png",
      left: "hidden",
      right: "Continue",
      uid: user._id,
      href: "/messages",
      bg:'bg-blf'
    });
  } catch (error) {
    console.log(error);
    return res.status(500).render("status", {
      title: "Network Issue",
      status: "Network Issue",
      message: "Network Issue Please try again",
      icon: "network.png",
      left: "hidden",
      right: "Try Again",
      href: "/login",
      bg:'bg-blin'
    });
  }
});

app.post("/uniqueId", async (req, res) => {
  if (req.body.uniqueId && req.body.password) {
    try {
      const user = await users.find({
        _id: req.body.uniqueId,
        password: req.body.password,
      });
      if (!user) {
        return res.render("404", { title: "Not Found" });
      }
      if (user) {
        console.log(user);
        console.log("Loged In");
        if (setCookies(user[0])) {
          return res.redirect("/messages");
        } else {
          console.log("SOME erro in login");
        }
      }
    } catch (error) {
      return res.status(404).render("error", { title: "Try Again" });
    }
  } else if (req.body.name && req.body.password) {
    console.log("Need to Register");
  }
});

app.get("/users/:uid", cookieAuth, async (req, res) => {
  const uid = req.params.uid;
  if(uid === req.id){
return res.redirect('/profile');
  }
  try {
    const user = await users.findById(uid);
    if (!user) {
      res.status(404).render("status", {
        title: "Invalid",
        status: "User not Found",
        message: "Provide a valid UID",
        icon: "404.png",
        right: "Try Again",
        href: "/messages",
        bg:'bg-blin'
      });
    }
    const { _id: id, name, profilePic, bio } = user;
    let title = `${name}-Profile`;
    res
      .status(200)
      .render("otherProfile", { id, name, profilePic, bio, title });
  } catch (error) {}
});

app.get("/profile", cookieAuth, (req, res) => {
  const uid = req.id;
  const name = req.name;
  const profilePic = req.profilePic;
  const bio = req.bio;
  const myPic = req.profilePic;

  res.render("profile", {
    title: "My Profile",
    name: name,
    uid: uid,
    myPic: myPic,
    bio: bio,
    blcount: "0",

  });
});

app.get("/profile/edit", cookieAuth, (req, res) => {
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
      console.log("Not user");
      return res.status(400).json({ message: "Not Updated" });
    }
    const token = setCookies(user); // Generate token
    res.cookie("token", token, { httpOnly: true }); // Set cookie after token generation
    res.status(201).json({ status: "success", message: "Updated" });
  } catch (err) {
    console.log(err);
  }
});

app.get("/viewProfile/:uid", async (req, res) => {
  const userId = req.params.uid;
  try {
    const user = await users.findById(userId);
    console.log("this is user", user);
    if (user) {
      const userData = {
        uid: user._id,
        name: user.name,
        bio: user.bio,
        profilePic: user.profilePic,
      };
      console.log("this is userData", userData);
      res.status(200).json({
        status: "success",
        data: {
          user: userData,
        },
      });
    } else {
      res.status(404).json({
        status: "fail",
        message: "Not Found",
      });
    }
  } catch (error) {
    res.status(404).json({
      status: "Error",
      message: "Unexpected",
    });
  }
});

// Page 3 , Register -> Post at /register
app.get("/messages", cookieAuth, async (req, res) => {
  const userId = req.id;
  const myPic = req.profilePic;
  try {
    console.log(userId);
    const user = await users.findById(userId);
    console.log(user);
    if (!user) {
      return res.status(404).render('status',{ status:"Network Error",message:'Please try Again',right:'Try Again',href:'/messages',title:"Network error",icon:'network.png',bg:'bg-blin'})
    }
    const friendData = user.friendsDetails.map((friend) => ({
      state: friend.state,
      name: friend.name,
      profilePic: friend.profilePic || "default.jpg", // Set default if profilePic is missing
      chatId: friend._id,
    })); // Create an array of friend objects with only name and profilePic

    res.render("messages", { friendData, title: "Messages", myPic });
  } catch (error) {
    console.error(error);
    return res.status(500).render('status',{ status:"Network Error",message:'Please try Again',right:'Try Again',href:'/messages',title:"Network error",icon:'network.png',bg:'bg-blin'})
  }

  // res.render("share" , {title:"Messages"});
});

app.patch("/requests/:id", cookieAuth, async (req, res) => {
  console.log("Request get here");
  
  const uid = req.id;
  const receiverId = req.params.id;
if(uid === receiverId){
  return res.status(404).json({
    status:'fail',
    message:'YourSelf'
  })
}
  
  console.log(receiverId);
  const senderData = {
    state: "received",
    name: req.name,
    profilePic: req.profilePic,
    _id: `${uid}${receiverId}`,
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
  _id:`${uid}${receiverId}`,
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
      console.log("exist")
      res.status(400).json({
        status:'fail',
        message:'Cannot send Request'
      })
    }

  
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status:'fail',
      message:'Some Network Error'
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
      return res.status(404).json({ message: "User not found" });
    }
    const friendData = user.friendsDetails.map((friend) => ({
      state: friend.state,
      name: friend.name,
      profilePic: friend.profilePic || "default.jpg", // Set default if profilePic is missing
      chatId: friend._id,
    })); // Create an array of friend objects with only name and profilePic

    res.render("requests", { friendData, title: "Requests",myPic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
  // res.render("share" , {title:"Messages"});
});

// app.get("/messages/:userId", cookieAuth, async (req, res) => {

//   try {
//     const userId = req.params.userId;
//     console.log(userId);
//     const user = await users.findById(userId);
//     console.log(user);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const friendData = user.friendsDetails.map((friend) => ({
//       state: friend.state,
//       name: friend.name,
//       profilePic: friend.profilePic || "default.jpg", // Set default if profilePic is missing
//       chatId: friend._id,
//     })); // Create an array of friend objects with only name and profilePic

//     res.render("messages", { friendData, title:"Messages" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// app.get("/requests/:userId", cookieAuth, async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     console.log(userId);
//     const user = await users.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: "Invalid" });
//     }

//     const friendData = user.friendsDetails.map((friend) => ({
//       state: friend.state,
//       name: friend.name,
//       profilePic: friend.profilePic || "default.jpg", // Set default if profilePic is missing
//       chatId: friend._id,
//     })); // Create an array of friend objects with only name and profilePic

//     res.render("requests", { friendData });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

app.patch("/requests/accept/:rid", async (req, res) => {
  console.log("accept/:userId , Patch");
  const userId = req.params.rid;
  //     const session =await mongoose.startSession();
  //    session.startTransaction();

  // const [user1Update , user2Update] = await Promise.all([

  // ])

  try {
    const result = await users.updateMany(
      { "friendsDetails._id": { $in: [userId] } },
      { $set: { "friendsDetails.$[friend].state": "connected" } },
      { arrayFilters: [{ "friend._id": userId }] }
    );
    console.log(result);
    console.log("Updated", result.modifiedCount, "documents.");
  } catch (error) {
    console.log(error);
  }

  //   users.findOneAndUpdate({friendsDetails:{chatId:userId}} , { friendsDetails:{ state :'connected'}})
});

function extractString(userId) {
  if (typeof userId !== "string" || userId.length !== 48) {
    console.log("Either id is not string or not of length 48");
    return res.status(404).json({
      message: "Error",
    });
  }
  const str1 = userId.slice(0, 24);
  const str2 = userId.slice(24);
  return [str1, str2];
}

app.get("/blockedUsers", cookieAuth, async (req, res) => {
  console.log("hi here ")
  const uid = req.id;
  try {
    console.log(uid);
    const user = await users.findById(uid);
    console.log(user);
    if (!user) {
      return res.status(404).render("blocked", { title: "Blocked" });
    }
    const friendData = user.friendsDetails.map((friend) => ({
      state: friend.state,
      name: friend.name,
      profilePic: friend.profilePic,
      chatId: friend._id,
    }));
    res.status(200).render("blocked", { title: "Blocked", friendData });
  } catch (err) {
    console.log(err);
  }
});

// Logout User
app.get("/logout", cookieAuth, (req, res) => {
  if (req.id.length === 24) {
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
    res.status(404).json({
      status: "fail",
      message: "Catch",
    });
  }
});

app.delete("/requests/delete/:rid", async (req, res) => {
  const userId = req.params.rid;
  console.log("delete");
  console.log(userId);

  function extractString(userId) {
    if (typeof userId !== "string" || userId.length !== 48) {
      console.log("Either id is not string or not of length 48");
      return res.status(404).json({
        message: "Error",
      });
    }
    const str1 = userId.slice(0, 24);
    const str2 = userId.slice(24);
    return [str1, str2];
  }

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
        message: "Deleted",
      });
    } else {
      res.status(404).json({
        message: "Error",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(404).json({
      message: "Error",
    });
  }

  // try {

  //     const result = await users.updateMany(
  //         { "friendsDetails._id": { $in: [userId] } },
  //         { $set: { "friendsDetails.$[friend].state": "connected" } },
  //         { arrayFilters: [{ "friend._id": userId }] }
  //       );
  //       console.log(result);
  //       console.log("Updated", result.modifiedCount, "documents.");

  // } catch (error) {
  //     console.log(error)
  // }
});

app.get("/messages/:chatId", cookieAuth, async (req, res) => {
  tid = req.cookies.token;
  console.log(tid);
  const chatId = req.params.chatId;
  const chatIds = extractString(chatId);

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
      });
    } catch (error) {
      console.log(error);
      return res.status(404).redirect("/error");
    }
  } else {
    res.status(404).redirect("/fail");
  }
});
// app.post("/messages/:chatId", cookieAuth, (req, res) => {
//   const chatId = req.params.chatId;
//   console.log(chatId);
//   res.render("chat",{title:"Chat"});
// });

app.get("/success", (req, res) => {
  res.render("success", { title: "Success" });
});
app.get("/warning", (req, res) => {
  res.render("warning", { title: "Warning" });
});
app.get("/error", (req, res) => {
  res.render("error", { title: "Error" });
});
app.get("/fail", (req, res) => {
  res.render("fail", { title: "Fail" });
});
app.get("/invalid", (req, res) => {
  res.render("404", { title: "404" });
});

app.get("/exist", (req, res) => {
  res.render("exist", { title: "Exist" });
});

// app.get('/chats/' , (req,res)=>{
//     res.sendFile(`${__dirname}/public/startChat.html` );
// })

// app.post('/chats' , async (req,res)=>{
//     try {
//         const data = await users.insertMany(req.body);
//         res.status(201).json({
//             status:'success',
//             data:{
//                 user:data
//             }
//         })
//     } catch (error) {
//         res.status(404).json({
//             status:'fail',
//             message:error.message
//         })
//     }

// });
// Exporting app (Express object)

module.exports = { server , app}