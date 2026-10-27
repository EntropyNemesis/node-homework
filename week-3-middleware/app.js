const express = require("express");
const dogsRouter = require("./routes/dogs");
const path = require("path");
const app = express();
const { randomUUID } = require("crypto");


// Assignment 3b and 3c ask you to add middleware in this file.


app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`)
  next();
});

app.use(express.json());

app.use(express.static(path.join(__dirname, '/public')));

app.use("/", dogsRouter);// Do not remove this line

function notFound(req, res) {
  res.status(404).json({
    "error": "Route not found",
    "requestId": req.requestId
  });
}

app.use(notFound);

function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({
    "error": "Internal Server Error",
    "requestId": req.requestId
  });
}

app.use(errorHandler);

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;

