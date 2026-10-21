const express = require("express");

const app = express();

app.use(express.json());  //this line is important, converts the raw json to an object readable by the server receiving the request.

app.get("/info", (req, res) => {
  res.json({
    message: "This is an Express server.",
  });
});

app.post("/echo", (req, res) => {
  res.json({
    weReceived: req.body,
  });
});

const port = 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});