const jwt = require('jsonwebtoken');
function setCookies(user){
    const id = user._id;
    const name = user.name;
    const profilePic = user.profilePic;
    const bio = user.bio;

    // let generate jwt tockets here
    const daysToExpire = 15;
    const secondsPerDay = 24 * 60 * 60;
    const expiresIn = daysToExpire * secondsPerDay;
    const payload = { id, name, profilePic , bio };
    try {
      const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {expiresIn});
    if(token){
      return token;
    }
    else{
     return console.log("not tocken")
    }
    } catch (error) {
      console.log(error);
    }

  }
  module.exports = setCookies;