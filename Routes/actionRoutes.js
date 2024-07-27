const express = require("express");
const router = express.Router();
const actionControllers = require("../Controllers/action");
const checkCookies = require("../Middlewares/checkCookies");
const cookieAuth = require("../Middlewares/auth");



router.get("/blockedUsers", cookieAuth, actionControllers.getBlockedUsers);
  router.patch("/unblock",cookieAuth,actionControllers.unblock);
  
  router.patch("/block",cookieAuth,actionControllers.block);
  
  // Logout User
  router.get("/logout", cookieAuth,actionControllers.logout);
  
  // Deleting account
  router.delete("/delete", cookieAuth,actionControllers.deleteAccount );

router.get('/myCustomRef',cookieAuth, actionControllers.refresh)
module.exports = router;