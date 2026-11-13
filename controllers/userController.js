//these imports, involving the built-in crypto module, enable us to hash the passwords
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
//the require import below enables db connection
const pool = require("../db/pg-pool");

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

//inserts a user into the database
async function register(req, res, next) {
  if (!req.body) req.body = {};
  //checking req.body before creating user
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });

  // use value.email, value.name, and value.password after this point

  value.hashed_password = await hashPassword(value.password);
  let result = null;

  try {
    result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
          VALUES ($1, $2, $3) RETURNING id, email, name`,
      [value.email, value.name, value.hashed_password],
    ); // note: using a parameterized query
  } catch (e) {
    // the email might already be registered
    if (e.code === "23505") {
      return res
        .status(400)
        .json({ message: "A user with that email already exists." });
    }
    //all other errors go to the global error handler
    return next(e);
  }

  //the new user row created by the database
  const user = result.rows[0];

  //mark the user as logged in by storing their database id
  global.user_id = user.id;

  //sends the response as JSON
  res.status(201).json({ name: user.name, email: user.email });
}

async function logon(req, res) {
  const { email, password } = req.body;

  //const registeredUser = global.users.find(user => user.email === email)
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  const registeredUser = result.rows[0];

  const goodCredentials =
    registeredUser &&
    (await comparePassword(password, registeredUser.hashed_password));

  if (!goodCredentials) {
    res
      .status(401)
      .json({ message: "Could not log on, due to invalid email or password." });
    return;
  }

  global.user_id = registeredUser.id;
  res
    .status(200)
    .json({ name: registeredUser.name, email: registeredUser.email });
}

function logoff(req, res) {
  global.user_id = null;
  res
    .status(200)
    .json({ message: "You have successfully logged out. See you soon!" });
}

module.exports = {
  register,
  logon,
  logoff,
};
