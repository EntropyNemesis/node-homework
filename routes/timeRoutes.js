const express = require("express");
const timeController = require("../controllers/timeController");

const router = express.Router();

//routes. aka "route definitions", "registering routes". each includes the method, the path, and names the route handler that will run in the controller file when a request is made to this method and path.
router.get("/time", timeController.getTime);
router.post("/echo", timeController.echoBody);

module.exports = router;