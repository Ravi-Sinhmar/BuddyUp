
const {getFid,
    getHourDifference,
    extractString,
  } = require("./common");

const users = require("./../Models/users");
const chats = require("./../Models/chats");
exports.allMessages = async (req, res) => {
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
  
  friendData.forEach(el => {
    if (el.state === 'connected') {
      custom = 'hidden';
      allMsg = 'show';
      return true; // Break the loop
    }
    return false; // Continue to the next element
  });
      return res.status(200).render("messages", { friendData, title: "Messages", myPic,custom,allMsg });
    } catch (error) {
      console.log(error);
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
  }

  exports.specificChat = async (req, res) => {
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
          time: getHourDifference(message.createdAt)  // Format time for display
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
  }