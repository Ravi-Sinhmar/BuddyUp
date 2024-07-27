const express = require("express");
const router = express.Router();
const userControllers = require("./../Controllers/userControllers");
const checkCookies = require("./../Middlewares/checkCookies");
let specialCase =0;
// Welcome
router.get("/", userControllers.welcome);
// Register
router.get("/register", userControllers.getRegister);
//   Check Username Existence
router.get("/check", userControllers.check);
//   Register User Post
router.post("/register", userControllers.postRegister);
// Login Get
router.get("/login", checkCookies, userControllers.getLogin);
// Login Post
router.post("/login", checkCookies, userControllers.postLogin);

module.exports = router;
