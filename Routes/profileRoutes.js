const express = require("express");
const router = express.Router();
const profileControllers = require("../Controllers/profileControllers");
const checkCookies = require("../Middlewares/checkCookies");
const cookieAuth = require("../Middlewares/auth");


router.get("/users/:uid", cookieAuth, profileControllers.userProfile );

router.get("/profile", cookieAuth,profileControllers.myProfile );

router.get("/profile/edit",cookieAuth, profileControllers.editProfile);

router.patch("/profile/edit", cookieAuth, profileControllers.SaveEditProfile);


module.exports = router;