const express = require("express");
const router = express.Router();
const postsControllers = require("../Controllers/postsControllers");
const checkCookies = require("../Middlewares/checkCookies");
const cookieAuth = require("../Middlewares/auth");


router.get('/posts/:uid',cookieAuth,postsControllers.userPosts);
router.get('/yourPosts',cookieAuth,postsControllers.myPosts);
router.get('/posts',cookieAuth, postsControllers.allPosts);
router.patch('/posts',cookieAuth, postsControllers.addPosts);
router.delete('/posts',cookieAuth, postsControllers.deletePosts);
      




module.exports = router;