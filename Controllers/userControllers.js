const users = require('../Models/users');

// welcome 
exports.welcome = (req, res) => {
    if (req.cookies.token && req.uid) {
      return res.status(301).redirect("messages");
    }
    res.render("welcome", { title: "Welcome" });
  }
// register 
  exports.getRegister = (req, res) => {
    if (req.cookies.token && req.uid && req.uid.length != 24) {
      return res.status(301).redirect("/messages");
    }
   res.status(200).render('register',{title:"Register"});
  }

//   check 
exports.check = async (req, res) => {
    const { username } = req.query;
     console.log(username);
    // Query your database (pseudo-code)
    try {
      const userExists = await users.findById(username);
  console.log(userExists);
   if(!userExists){
    res.status(200).json({status:'success'})
   }
   else{
    res.status(404).json({status:"fail"});
   }
    } catch (error) {
      res.status(500).json({
        status: "fail",
        message: "500",
      });
    }
  
  }

// postRegister
exports.postRegister = async (req, res) => {
    console.log("it is here");
      try {
        const user = await users.create(req.body);
        if (!user) {
          return res.status(500).render('resultBox',
          {
            title:"Failed",
            type:"500",
            status:"Try Again",
            message:"We Encountered a Problem with Your Registration",
            href:"/register"
          }
        )
        }
        const token = setCookies(user); // Generate token
        res.cookie("token", token, { httpOnly: true }); // Set cookie after token generation
        res.status(201).render("resultBox", {
          title: "Success",
          type:"success",
          status: "Success",
          message:
            "You have registerd successfully",
             href :'/profile/edit',
        });
      } catch (error) {
        return res.status(500).render('resultBox',
          {
            title:"Failed",
            type:"500",
            status:"Try Again",
            message:"We Encountered a Problem with Your Registration",
            href:"/register"
          }
        )
      }
    }

    // getLogin
    exports.getLogin = (req, res) => {
        if (req.cookies.token && req.uid && req.uid.length != 24) {
          return res.status(301).redirect("messages");
        }
        return res.render("login", { title: "Login" });
      }

// postLogin
exports.postLogin = async (req, res) => {
    if (!req.body.uniqueId || !req.body.password) {
      return res.status(404).render('resultBox',
        {
          title:"Failed",
          type:"fail",
          status:"Failed",
          message:"Looks Like You Missed Something: Review your fields again",
          href:"/login"
        }
      )
    }
  
    const uid = req.body.uniqueId;
    const password = req.body.password;
  
    try {
      const user = await users.findById({ _id: uid, password: password });
       console.log(user);
      if (!user) {
        return res.status(404).render('resultBox',
          {
            title:"Not Found",
            type:"fail",
            status:"Not Found",
            message:"Looks like you don't have an account yet. Sign up for free",
            href:"/register"
          }
        )
      }
      const token = setCookies(user); // Generate token
      console.log(token);
      res.cookie("token", token, { httpOnly: true }); // Set cookie after token generation
      return res.status(404).render('resultBox',
        {
          title:"Success",
          type:"success",
          status:"Sucess",
          message:`Welcome Back,${user.name}`,
          href:"/messages"
        }
      )
    } catch (error) {
      return res.status(500).render('resultBox',
        {
          title:"Failed",
          type:"500",
          status:"Try Again",
          message:"We Encountered a Problem with Your Login",
          href:"/login"
        }
      )
    }
  }

module.exports;

  