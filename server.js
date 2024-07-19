//  .env config
const dotenv = require('dotenv');
dotenv.config({path: './.env'});
const port = process.env.PORT || 3000;

// Importing Database connection module 
const connection = require('./Database/connection');

// Imporing custom moduels
const  {server }  = require('./app');

server.listen(port || 3000, () => {
  console.log(`Server is listening at port ${port || process.env.VERCEL_PORT || 3000}`);
});