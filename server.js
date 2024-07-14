//  .env config
const dotenv = require('dotenv');
dotenv.config({path: './.env'});
const mongoose = require ('mongoose');




// Imporing custom moduels
const app = require('./app');



// Connection with DB
mongoose.connect(process.env.REMOTE_DB_STR).then((conn)=>{
    console.log("DB Connected SuccessFully")
  }).catch((err)=>{
    console.log("DB not Connected , Some error");
  })

port = process.env.PORT;
app.listen(port , ()=>{
    console.log(`Sever is listining at port ${port}`);
})