// all blocked users
const users = require('./../Models/users');
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
      res.clearCookie("token");
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
  }

  module.exports;
