const jwt = require('jsonwebtoken');
const checkCookies = (req,res,next)=>{
    const token = req.cookies.token;
    if(!token){
        next();
        return;
    }
    try {
    const data  = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.uid = data.id;
    if(req.uid){
     next();
    }
    else{
        res.clearCookie('token', {
            path: '/',
            domain: 'localhost', // Or your domain if applicable
            secure: false, // Set to true if using HTTPS
            httpOnly: false // Set to true if necessary
          });
        next();
        return;
    }
    } catch (error) {
        console.log(error);
        res.clearCookie('token', {
            path: '/',
            domain: 'localhost', // Or your domain if applicable
            secure: false, // Set to true if using HTTPS
            httpOnly: false // Set to true if necessary
          });
        return;
        
    }

}
module.exports = checkCookies;