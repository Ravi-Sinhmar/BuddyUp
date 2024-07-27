// all blocked users
const chats = require('../Models/chats');
const quotes = require('../Models/quotes');
const users = require('./../Models/users');
const { getLocalTimeString } = require('./common');
exports.getBlockedUsers = async (req, res) => {
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
let custom = 'show';
let allBlock = 'hidden';
friendData.forEach(el =>{

  if(el.state === 'blocked'){
    custom = "hidden";
    allBlock = "show";
    return true;
  }
  else{
    return false;
  }

});

    
      res.status(200).render("blocked", { title: "Blocked", friendData, myPic ,custom ,allBlock});
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
  }

//   Unblock 

  exports.unblock = async(req,res)=>{
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
  
  }


//   block 
exports.block = async(req,res)=>{
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
  }

//   logout
exports.logout =  (req, res) => {
    if (req.id) {
      res.clearCookie('token');
      return res.status(200).json({
        status: "success",
        messsage: "Your are successfully logged out",
      });
    }
  }

//   delete account
exports.deleteAccount = async (req, res) => {
    const uid = req.id;
    try {
const delPost = await quotes.deleteMany({wId:uid});
if (!delPost) {
  console.log("no user");     
  return res.status(400).json({ status: "fail", message: "notPosts" });
}

if(delPost){
  console.log("quotes update");
  const bulkWriteOperations = [];
  const usersData = await users.find({ friends: { $in: [uid] } });
  
  usersData.forEach(user => {
    const chatId1 = `${uid}-${user._id}`;
    const chatId2 = `${user._id}-${uid}`;
  
    const updateDoc = {
      updateOne: {
        filter: { _id: user._id },
        update: {
          $pull: {
            friends: uid,
            friendsDetails: {
              _id: { $in: [chatId1, chatId2] }
            }
          }
        }
      }
    };
    bulkWriteOperations.push(updateDoc);
  
    // Delete chats
    const deleteChatOp = {
      deleteMany: {
        filter: { chatId: { $in: [chatId1, chatId2] } }
      }
    };
    bulkWriteOperations.push(deleteChatOp);
  });
  
  const result = await users.bulkWrite(bulkWriteOperations);
  const chatResult = await chats.bulkWrite(bulkWriteOperations);
  
  console.log(result);
  console.log(chatResult);
 
if(!result || !chatResult){
  console.log("not rres not chatrers");
  console.log(result);
  console.log(chatResult);
  return res.status(404).json({
    status: "fail",
    message: "notBoth",
  })
}
if(result && chatResult){
 console.log("Delted till now");
  console.log(result);
  console.log(chatResult);
const user = await users.deleteOne({_id:uid});
if (user.deletedCount === 1) {
  console.log("Finaly Delted")
  res.clearCookie('token');
  return res.json({ status: 'success', message: 'Your Account has been deleted permanently' });
} else {
  console.log("User not delete at last step")
  console.log(result);
  console.log(chatResult);
  console.log(user);

return res.status(404).json({
    status: "fail",
    message: "Try Again",
  });
}

}



    }
  }catch (error) {
      console.log(error);
       return res.status(500).json({
        status: "fail",
        message: "500",
      });
    }
  }



  exports.refresh = async(req,res) =>{
    const refresh  = req.id;
    let currentTime = new Date().toISOString();
    currentTime = getLocalTimeString(currentTime);

    try {
      const user = users.findById(refresh);
      if(user){
       return res.status(200).render('refresh',{title:'refresh' ,status:'Refreshing Start from time:',message:currentTime, });

      }
      else{
        return res.status(400).render('refresh',{title:'Fail' ,status:'Fail to Refresh',message:currentTime, });
       }
    } catch (error) {
      console.log(error);
      return res.status(500).render('refresh',{title:'Fail' ,status:'Fail to Refresh due to network error',message:currentTime, });
    }
   
  }