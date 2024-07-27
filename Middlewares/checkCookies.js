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
    console.log(data);
    
    if(req.uid){
     return res.redirect('messages');
    }
    else{
        res.clearCookie("token");
        next();
        return;
    }
    } catch (error) {
        console.log(error);
        res.clearCookie("token");
        return;
        
    }

}
module.exports = checkCookies;