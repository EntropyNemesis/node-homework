const fs = require('fs');
const path = require('path');


// Write a sample file for demonstration

const sampleFilesDir = path.join(__dirname, 'sample-files');
const asyncDemoPath = path.join(sampleFilesDir, 'sample.txt');  //using this makes the function call work from any directory, instead of hardcoding the path inside the function

fs.mkdirSync(sampleFilesDir, { recursive: true });
fs.writeFileSync(asyncDemoPath, 'Hello, async world!');

// 1. Callback style


fs.readFile(asyncDemoPath, "utf8", (err, content) => {
  if (err) {
    console.log("File read failed:", err.message);
    return;
  }
  console.log('Callback read:', content);
});

// Callback hell example (test and leave it in comments):

//Callback hell is a situation where a series of callbacks, each dependent on the previous one, are nested to the point that it negatively affects readability of the code.

// const callbackHellDemoPath = path.join(sampleFilesDir, 'callback-hell.txt');

// fs.readFile(asyncDemoPath, "utf8", (err, content) => {
//   if (err) {
//     console.log("File read failed:", err.message);
//     return;
//   }
//     fs.copyFile(asyncDemoPath, callbackHellDemoPath, (err) => {
//       if (err) {
//         console.log("File copy failed:", err.message);
//         return;
//       }
//       fs.appendFile(callbackHellDemoPath, ' This second greeting is for our copy file.', (err) => {
//         if (err) {
//           console.log("File append failed:", err.message);
//           return;
//         }
//         fs.stat(callbackHellDemoPath, (err, stats) => {
//           if (err) {
//             console.log("File stat calc failed:", err.message);
//             return;
//           }
//           console.log('Callback hell demo file size: ', stats.size);
//       });
//     });
//   });
// });

  // 2. Promise style

fs.promises.readFile(asyncDemoPath, "utf8")
  .then((content) => {
    console.log('Promise read:', content);
  })
  .catch((err) => {
    console.log(err.message);
  });

    // 3. Async/Await style

async function readWithAwait() {
  try {
    const content = await fs.promises.readFile(asyncDemoPath, "utf8");
    console.log('Async/Await read:', content);
  } 
  catch (err) {
    console.log("File operation failed:", err.message);
  }
}

readWithAwait();