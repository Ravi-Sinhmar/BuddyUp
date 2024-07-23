const express = require("express");
const router = express.Router();
const requestsControllers = require("../Controllers/requestsControllers");
const checkCookies = require("../Middlewares/checkCookies");
const cookieAuth = require("../Middlewares/auth");

  router.patch("/requests/:id", cookieAuth,requestsControllers.sendRequest );
  
  router.get("/requests", cookieAuth, requestsControllers.allRequests);
  
  router.patch("/requests/accept/:rid",cookieAuth, requestsControllers.acceptRequest);

  router.delete("/requests/delete/:rid", cookieAuth,requestsControllers.deleteRequest);
  
  router.delete("/requests/remove/:rid",cookieAuth,requestsControllers.removeRequest );


module.exports = router;