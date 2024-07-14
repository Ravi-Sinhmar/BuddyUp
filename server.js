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

  const port = process.env.PORT; // Still keep this line to check for a custom port

  app.listen(port || 3000, () => {
    console.log(`Server is listening at port ${port || process.env.PORT || 3000}`);
  });