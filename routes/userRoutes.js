const express = require("express");
const userController = require("../controllers/userController");

const userRouter = express.Router();

//routes. aka "route definitions", "registering routes". each includes the method, the path, and names the route handler that will run in the controller file when a request is made to this method and path.
userRouter.post("/register", userController.register);
userRouter.post("/logon", userController.logon);
userRouter.post("/logoff", userController.logoff);

module.exports = userRouter;