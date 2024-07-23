const express = require("express");
const router = express.Router();
const quotesControllers = require("../Controllers/quotesControllers");
const checkCookies = require("../Middlewares/checkCookies");
const cookieAuth = require("../Middlewares/auth");


router.get('/quotes/:uid',cookieAuth, quotesControllers.userQuotes);
router.get('/yourQuotes',cookieAuth,quotesControllers.myQuotes);
router.get('/quotes',cookieAuth, quotesControllers.allQuotes);
router.patch('/quotes',cookieAuth, quotesControllers.addQuotes);
      




module.exports = router;