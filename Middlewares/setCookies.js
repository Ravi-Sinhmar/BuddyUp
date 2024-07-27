const jwt = require('jsonwebtoken');
function setCookies(user){
    const id = user._id;
    const name = user.name;
    const profilePic = user.profilePic;
    const bio = user.bio;

    // let generate jwt tockets here
    const daysInMilliseconds = 15 * 24 * 60 * 60 * 1000;
    const expiresIn = Math.floor(daysInMilliseconds / 1000);
    const payload = { id, name, profilePic , bio };
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn,
    });
    res.cookie("token", token, { httpOnly: true });
   return token;
  }

  module.exports = setCookies;