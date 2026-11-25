const prisma = require("./db/prisma");
const express = require("express");
const app = express();
app.use(express.json());

global.user_id = null;

const timeRouter = require("./routes/timeRoutes");
app.use("/api", timeRouter);

const userRouter = require("./routes/userRoutes");
app.use("/api/users", userRouter);

const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");
app.use("/api/tasks", authMiddleware, taskRouter);

const analyticsRouter = require("./routes/analyticsRoutes");
app.use("/api/analytics", authMiddleware, analyticsRouter);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

//health check prisma version, verifies database connectivity
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

app.post("/testpost", (req, res) => {
  res.status(200).json({
    message: "POST route works",
  });
});

const notFound = require("./middleware/not-found");
app.use(notFound);

const errorHandler = require("./middleware/error-handler");
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, (error) => {
  if (error) {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use.`);
    } else {
      console.error("Server startup error:", error);
    }
    process.exit(1);
    return;
  }

  console.log(`Server is listening on port ${port}...`);
});

let isShuttingDown = false;

async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("Shutting down gracefully...");

  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log("HTTP server closed.");

    // Close all PostgreSQL connections after the HTTP server has stopped. 
    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

module.exports = { app, server };