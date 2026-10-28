const express = require("express");
const dogsRouter = require("./routes/dogs");
const path = require("path");
const app = express();
const { randomUUID } = require("crypto");


// Assignment 3b and 3c ask you to add middleware in this file.


app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.set({
    'X-Request-Id': req.requestId
  });
  next();
});

//logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`)
  next();
});

//setting security headers in optional task 14
app.use((req, res, next) => {
    res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });
  next();
});

app.use(express.json({ limit: "1mb" }));

app.use(express.static(path.join(__dirname, '/public')));

function requireJson(req, res, next) {
  const methodsWithBody = ["POST", "PUT", "PATCH"];

  if (methodsWithBody.includes(req.method) && !req.is("application/json")) {
    return res.status(400).json({
      error: "Content-Type must be application/json",
      "requestId": req.requestId
    });
  }
  next();
}

app.use(requireJson);

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

