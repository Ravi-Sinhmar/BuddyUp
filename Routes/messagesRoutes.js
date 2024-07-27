const express = require("express");
const router = express.Router();
const messagesControllers = require("../Controllers/messagesControllers");
const checkCookies = require("../Middlewares/checkCookies");
const cookieAuth = require("../Middlewares/auth");

router.get("/messages", cookieAuth,messagesControllers.allMessages );
router.get("/messages/:chatId",cookieAuth, messagesControllers.specificChat);
router.delete("/messages/:chatId",cookieAuth, messagesControllers.clearChat);
router.get('/message/:rid',cookieAuth, messagesControllers.scrollFetch);
router.patch('/lastMsg',cookieAuth, messagesControllers.scrollFetch);

module.exports = router;