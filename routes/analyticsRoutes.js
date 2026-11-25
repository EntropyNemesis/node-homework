const express = require("express");
const analyticsController = require("../controllers/analyticsController");

const analyticsRouter = express.Router();

analyticsRouter.get("/users", analyticsController.getUsersWithStats);
analyticsRouter.get("/tasks/search", analyticsController.searchTasks);
analyticsRouter.get("/users/:id", analyticsController.getUserAnalytics);

module.exports = analyticsRouter;