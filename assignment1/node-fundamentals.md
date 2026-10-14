# Node.js Fundamentals

## What is Node.js?
Node is a runtime (an environment created for running the code) that allows Javascript to be run directly on the computer or server, outside the browser.

## How does Node.js differ from running JavaScript in the browser?
There is no sandboxing of the code, and Node can read/write and interact directly with files stored locally.  It can read environement variables, work with OS services, and with backend libraries like Express.  Browser JS works with web pages, browser-based APIs and the DOM, while Node.js works with backend APIs, files, servers, and processes.

## What is the V8 engine, and how does Node use it?
The V8 engine is an engine program, developed by Google originally for use in Chrome, that takes Javascript code and turns it into fast instructions the computer can use. Node uses it to write Javascript outside the browser.

## What are some key use cases for Node.js?
Web service APIs, real-time update apps like dashboards, command line interface tools for automation, and build tools/scripts that process files or bundle code.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

CommonJS and ES Modules achieve the same things, but using different syntax. The below examples are both for importing a prebuilt component or file for use in the code. 

**CommonJS (default in Node.js):**
```js
const { syncfunc } = require("../assignment1/callsync.js")
```

**ES Modules (supported in modern Node.js):**
```js
import { useState, useEffect } from 'react';
``` 