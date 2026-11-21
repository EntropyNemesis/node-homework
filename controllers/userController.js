const prisma = require("../db/prisma");
//these imports, involving the built-in crypto module, enable us to hash the passwords
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");

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

  value.hashedPassword = await hashPassword(value.password);
  let user = null;
  try {
    user = await prisma.user.create({
      data: { name: value.name, email: value.email, hashedPassword: value.hashedPassword },
      select: { name: true, email: true, id: true} // specify the column values to return
    });
  } catch (err) {
    // the email might already be registered
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      // send the appropriate error back -- the email was already registered
      return res
        .status(400)
        .json({ message: "A user with that email already exists." });
    } else {
      return next(err); // the error handler takes care of other errors
    }
  }

  //mark the user as logged in by storing their database id
  global.user_id = user.id;

  //sends the response as JSON
  res.status(201).json({ name: user.name, email: user.email });
}

async function logon(req, res) {
  let { email, password } = req.body;
  email = email.toLowerCase()
  const registeredUser = await prisma.user.findUnique({ where: { email }});

  const goodCredentials =
    registeredUser &&
    (await comparePassword(password, registeredUser.hashedPassword));

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
