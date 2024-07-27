const jwt = require('jsonwebtoken');
// Middleware to check if the user id is in the cookies or not
const cookieAuth = (req, res, next) => {
    const token = req.cookies.token;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.id = decoded.id; // Assuming the user ID is stored in the _id property of the decoded objec
      req.name = decoded.name;
      req.profilePic = decoded.profilePic;
      req.bio = decoded.bio;
      if(req.id){
        next();
      }
      else{
        res.clearCookie("token");
        return res.redirect("/");
      }
    
    } catch (err) {
      res.clearCookie("token");
      return res.redirect("/register");
    }
  };
  module.exports = cookieAuth;