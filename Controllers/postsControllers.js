
const quotes = require('./../Models/quotes');
const { extractString , getTimeDifference , getFid } = require('./common')


exports.userPosts = async(req,res)=>{
    const myPic = req.profilePic;
    const myId = req.id;
    const uid = req.params.uid;
    if(myId === uid){
      return res.status(200).redirect('/yourPosts');
    }
    console.log(myId)
    try {
      const data = await quotes.find({wId:uid});
      console.log("your posts");
      const allQuotes = data.map((qData) => ({
        wName: qData.wName,
        wPic: qData.wPic,
        wId: qData.wId , // Set default if profilePic is missing
        qId: qData._id,
        quote : qData.quote, 
        time : getTimeDifference(qData.createdAt)
      }));

      let custom = 'show';
      let allQts = 'hidden';

      if(data.length > 0){
        custom = 'hidden';
        allQts = 'show'
      }
      res.render('quotes.ejs',{title:"Posts",allQuotes,myPic,myId,navHead:uid,custom ,allQts});
    } catch (error) {
      return res.status(500).render('resultBox',
        {
          title:"Failed",
          type:"500",
          status:"Try Again",
          message:"We Encountered a Problem with showing Posts",
          href:"/posts"
        }
      )
    }
  }


//   my quotes 
exports.myPosts = async(req,res)=>{
    const myPic = req.profilePic;
    const myId = req.id;
    console.log(myId)
    try {
      const data = await quotes.find({wId:myId}).sort({ createdAt: -1 })
      const allQuotes = data.map((qData) => ({
        wName: qData.wName,
        wPic: qData.wPic,
        wId: qData.wId , // Set default if profilePic is missing
        qId: qData._id,
        quote : qData.quote,
        time : getTimeDifference(qData.createdAt),
        
      }));

      let custom = 'show';
      let allQts = 'hidden';

      if(data.length > 0){
        custom = 'hidden';
        allQts = 'show'
      }
       
      res.render('quotes.ejs',{title:"Your Posts",allQuotes,myPic,myId,navHead:"Your Posts",custom ,allQts});
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
  
  
  }

//   all quotes 

exports.allPosts = async(req,res)=>{
    const myPic = req.profilePic;
    const myId = req.id;
    try {
      const data = await quotes.find({}).sort({ createdAt: -1 })
      const allQuotes = data.map((qData) => ({
        wName: qData.wName,
        wPic: qData.wPic,
        wId: qData.wId , // Set default if profilePic is missing
        qId: qData._id,
        quote : qData.quote, 
        time : getTimeDifference(qData.createdAt)
      }));
    
      let custom = 'show';
      let allQts = 'hidden';

      if(data.length > 0){
        custom = 'hidden';
        allQts = 'show'
      }
  
      res.render('quotes.ejs',{title:"Quotes",allQuotes,myPic,myId,navHead:"All Posts" ,custom,allQts});
  
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
  
  
  }

//  save patch quotes
exports.addPosts = async(req,res)=>{
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
    
    }


    // delete post 
exports.deletePosts = async(req,res)=>{
  const myId = req.id;
const id = req.query.id;
const wId = req.query.wId;


if(wId != myId){
  return res.status(404).json({status:'fail',message:'500'})
}
      try {
        const result =await quotes.deleteOne({_id:id})
      console.log(result);

      if(result.deletedCount > 0){
        res.status(201).json({status:'success',message:'deleted'})
      }
     else{
    return  res.status(404).json({status:'fail',message:'500'})
      }
        
      } catch (error) {
      return  res.status(500).json({status:'fail',message:'500'})
      
      }
      
      }