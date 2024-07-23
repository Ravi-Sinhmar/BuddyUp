const users = require('./../Models/users');
const { extractString , getTimeDifference , getFid } = require('./common')


exports.sendRequest = async (req, res) => {
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
  }

  exports.allRequests =  async (req, res) => {
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
   
  }

  exports.acceptRequest = async (req, res) => {
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
  
  }

  exports.deleteRequest =  async (req, res) => {
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
  
  }

  exports.removeRequest = async (req, res) => {
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
  
  }

