
const quotes = require('./../Models/quotes');
const { extractString , getTimeDifference , getFid } = require('./common')


exports.userQuotes = async(req,res)=>{
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
        time : getTimeDifference(qData.createdAt)
      }));

      let custom = 'show';
      let allQts = 'hidden';

      if(data.length > 0){
        custom = 'hidden';
        allQts = 'show'
      }
      res.render('quotes.ejs',{title:"Quotes",allQuotes,myPic,myId,navHead:uid,custom ,allQts});
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
  }


//   my quotes 
exports.myQuotes = async(req,res)=>{
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
         
        time : getTimeDifference(qData.createdAt),
        
      }));

      let custom = 'show';
      let allQts = 'hidden';

      if(data.length > 0){
        custom = 'hidden';
        allQts = 'show'
      }
       
      res.render('quotes.ejs',{title:"Your Quotes",allQuotes,myPic,myId,navHead:"Your Quotes",custom ,allQts});
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

exports.allQuotes = async(req,res)=>{
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
        time : getTimeDifference(qData.createdAt)
      }));
      let custom = 'show';
      let allQts = 'hidden';

      if(data.length > 0){
        custom = 'hidden';
        allQts = 'show'
      }
  
      res.render('quotes.ejs',{title:"Quotes",allQuotes,myPic,myId,navHead:"All quotes" ,custom,allQts});
  
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
exports.addQuotes = async(req,res)=>{
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