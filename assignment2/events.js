//code below loads events.js and expects three things: an event named "time", a listener that logs "Time received:" followed by the message, and module.exports = emitter so the test can reach your emitter

const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("time", (message) => {
  console.log("Time received:", message);
});

module.exports = emitter;

//code below emits the "time" event every 5 seconds when the file is run directly with Node

if (require.main === module) {
  setInterval(() => {
    const currentTime = new Date().toString();
    emitter.emit("time", currentTime);
  }, 5000);
}

