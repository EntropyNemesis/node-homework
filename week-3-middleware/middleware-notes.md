# Week 3: Express Middleware Notes

## What is middleware?
A function that runs between the request arriving and the response being sent. It receives `(req, res, next)` and must do one of three things:
1. **Send a response** (`res.status(...).json(...)`), which ends the request.
2. **Call `next()`** to pass control to the next matching middleware or route.
3. **Call `next(error)`** to skip to the error handler.

If it does none of these, the request **hangs** until the client times out.

## Why does order matter?
Express runs middleware and routes **top to bottom**, in the order they're registered. Earlier middleware can change `req`/`res` for later ones, or end the request so later ones never run.

The dog rescue app's order, and why:

| # | Middleware | Why it's here |
|---|---|---|
| 1 | Request ID | First, so every later step (including logs and errors) can use `req.requestId` |
| 2 | Logger | Needs `req.requestId`, so it comes after #1 |
| 3 | Security headers | Before anything that might send a response, so *every* response gets them |
| 4 | `express.json({ limit: "1mb" })` | Before any route that reads `req.body` |
| 5 | `express.static(...)` | Sends image files directly, and doesn't call `next()` when it finds a file |
| 6 | `requireJson` | Has to reject bad requests *before* the route handles them |
| 7 | Dog routes | The real endpoints |
| 8 | `notFound` | Only unmatched requests get this far. It always responds, so nothing after it runs (except error handlers) |
| 9 | `errorHandler` | Last, as the safety net for `next(error)` |

**Lesson learned:** at first the request ID middleware was *after* `express.static`, so image responses never got an `X-Request-Id`. The test still passed because it only checked `/dogs`. **Passing tests don't prove everything is right.**

## Defining vs. registering
```js
function notFound(req, res) { ... }   // DEFINING: creates a function with a name
app.use(notFound);                     // REGISTERING: tells Express to run it in the chain
```
- Defining alone does nothing. Express doesn't know the function exists until `app.use(...)`.
- The definition can live in the same file (dog app) or in another file brought in with `require` (todo app's `middleware/` folder). The `app.use(...)` line is the same either way.
- `app.use((req, res, next) => { ... })` defines *and* registers in one step (an anonymous function).

## Where does each piece go? (main todo app)

| File | Job |
|---|---|
| `controllers/userController.js` | **What** happens: `register`, `logon`, `logoff` functions |
| `routes/userRoutes.js` | **When**: `POST /register` → `register`, etc. |
| `middleware/` | Shared steps: `not-found.js`, `error-handler.js` |
| `app.js` | Wires it all together: `express.json()`, `app.use("/api/users", userRouter)`, not-found, error handler |

A controller file has **no `app`** in it. It only defines and exports functions.

`app.use("/api/users", userRouter)` adds `/api/users` in front of every route inside the router, so `/register` becomes `/api/users/register`.

## Normal middleware vs. error handlers
| | Normal middleware | Error handler |
|---|---|---|
| Parameters | `(req, res, next)` | `(err, req, res, next)` |
| Runs when | A request reaches it in order | Something calls `next(error)` or throws |

Express recognizes an error handler by **counting its 4 parameters**. ESLint will say `'next' is defined but never used`, but **don't delete it**, because with only 3 parameters Express would treat it as normal middleware.

**Not-found vs. error handler:** a 404 means *no route matched*. A 500 means a route *started running and something broke*.

If you don't register your own, Express has built-in fallbacks for both, but they send **HTML**, not JSON.

## Custom error classes (`errors.js`)
```js
class ValidationError extends Error {
  constructor(message) {
    super(message);              // passes the message to Error
    this.name = "ValidationError";
    this.statusCode = 400;       // the error handler reads this
  }
}
```
Use them in a route: `return next(new ValidationError("Missing required fields"));`

The status-aware error handler uses `err.statusCode || 500`:
- **4xx:** `console.warn("WARN: ...")`, and the real message is sent (it helps the client fix the request).
- **500:** `console.error("ERROR: ...")`, and only `"Internal Server Error"` is sent (internal details stay out of the response).

**Server logs are for developers. API responses are for clients.**

## JavaScript I practiced

**Destructuring** pulls properties out of an object into variables with the same names:
```js
const { name, email, password } = req.body;
// same as: const name = req.body.name; const email = req.body.email; ...
```
`{ }` on the **left** of `=` means "unpack." On the **right**, it creates an object.

**Rest** puts "everything else" into a new object, which is handy for dropping the password:
```js
const { password, ...user } = userCredentials;
// user → { name, email }    (userCredentials still has its password)
```
If a variable named `password` already exists in the function, rename it while unpacking: `const { password: _ignored, ...user } = ...`

**Template literals** use backticks, with `${ }` to plug in values. Everything else inside is printed as plain text:
```js
console.log(`[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`);
```

**`.find()`** returns the first matching item, or `undefined`:
```js
const registeredUser = global.users.find(user => user.email === email);
```

**Early return** sends an error and stops, so the "happy path" stays un-nested at the bottom:
```js
if (!registeredUser || registeredUser.password !== password) {
  return res.status(401).json({ message: "Invalid email or password." });
}
```
The **order inside `||`** matters: `||` stops at the first true side, so check `!registeredUser` *before* reading `registeredUser.password`, or it crashes on `undefined`.

## Bugs I hit, and what they taught me

| Bug | Lesson |
|---|---|
| `const user = res.status(201).json(...)` | `res.json()` **sends** the response. It doesn't return your data. Build the object first, send last. |
| Code at the top level of a controller file | Top-level code runs **once** when the file is loaded, not on every request. Put it inside the function. |
| Exporting `logon`/`logoff` before they existed | `ReferenceError` when the file loads, which breaks *every* test. Add empty placeholder functions while you work. |
| `if (users => users.password === password)` | That **creates** a function and never calls it. A function is always truthy, so the `if` always passes. `.find()` calls arrow functions for you; `if` doesn't. |
| `res.json(user.name, user.email)` | `.json()` takes **one** argument. Wrap multiple values in an object. |
| `res.status(200)` alone in `logoff` | `.status()` only *sets* the code. `.json()` or `.send()` actually sends. |
| Copied `timeController`/`router` names into `userRoutes.js` | Variable names are labels. Every use has to match the declaration exactly. |
| `require("./errors")` from inside `routes/` | `./` = same folder, `../` = one folder up. |
| `express.static("public")` | Relative paths resolve from where you **ran** the command. Use `path.join(__dirname, "public")`. |
| `const path = ...` then `path = ...` | You can't reassign a `const`, and overwriting `path` would destroy the `path` tool anyway. |
| `${path}` printed `[object Object]` | `path` was the Node module, not `req.path`. |
| `req.contenttype` | That property doesn't exist. Use `req.is("application/json")`. |
| `methodsWithBody.includes(req.requestId)` | Check the property that actually holds what's in the list (`req.method`). |
| `dog.dogName === dogName` | Each side of a comparison uses its **own** object's property names: the dog data says `name`, the request says `dogName`. |
| AI review said Task 19 wasn't done | The commit was never **pushed**. Run `git status` before requesting a review. |

## Testing and debugging tools
- `npm run tdd assignment3a` (or `3b`, `3c`) runs the course tests.
- `node -e "require('./path/to/file')"` prints nothing if the file loads with no errors.
- `node -e "console.log(require('./middleware/error-handler').length)"` shows the parameter count (`4` for an error handler).
- `npx eslint <file>` finds unused variables and undefined names.
- In Postman, use the **full URL** (`http://localhost:3000/...`), and check the response **Headers** tab too, not just the body.
- `console.log` on the server prints in the **server's terminal**, not in Postman.
- If nodemon says `app crashed - waiting for file changes`, fix the file and save, or type `rs`.
- Run only one app on port 3000 at a time.
