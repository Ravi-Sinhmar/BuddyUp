
const mongoose = require('mongoose');
// Connection with DB
 const connection =  mongoose.connect(process.env.REMOTE_DB_STR).then((conn)=>{
    console.log("DB Connected SuccessFully")
  }).catch((err)=>{
    console.log("DB not Connected , Some error");
  });
  
module.exports = connection;
