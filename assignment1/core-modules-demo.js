const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log('Platform: ', os.platform());
console.log('CPU: ', os.cpus()[0].model);
console.log('Total Memory: ', os.totalmem());

// Path module
console.log('Joined path: ', path.join(__dirname, 'sample-files'));

// fs.promises API
const demoPath = path.join(sampleFilesDir, 'demo.txt');  //using this makes the function call work from any directory, instead of hardcoding the path inside the run function

async function run() {
  try {
    await fs.promises.writeFile(demoPath, "Hello from fs.promises!");
    const content = await fs.promises.readFile(demoPath, "utf8");

    console.log('fs.promises read: ', content);
  } catch (err) {
    console.log("File operation failed:", err.message);
  }
}

run();

// Streams for large files- log first 40 chars of each chunk
