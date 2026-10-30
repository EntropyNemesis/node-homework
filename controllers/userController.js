//these imports, involving the built-in crypto module, enable us to hash the passwords
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

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

function register(req, res) {
  //builds the full user object with credentials. req.body is the parsed JSON the client sent, and we are pulling the 3 relevant fields from it.
  /*const userCredentials = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  };  */

  const hashedPassword = await hashPassword(password);

  const userCredentials = {
    email,
    name,
    hashedPassword,
  };



  //save the new user creds/profile object in global.users, the temporary in-memory "database" (array). push adds this user to the end.
  global.users.push(userCredentials);

  //mark the user as logged in
  global.user_id = userCredentials;

  // makes a safe copy of the user object without the password. reads as: "from userCredentails, pull password into its own variable and put everything else into a new object called user"
  const {password, ...user} = userCredentials;

  //sends the response as JSON
  res.status(201).json(user)
};

function logon(req, res) {
    const {email, password} = req.body;

    const registeredUser = global.users.find(user => user.email === email)
        if (!registeredUser || registeredUser.password !== password) {
            res.status(401).json({message: "Could not log on, due to invalid email or password."})
            return;
        }
        
        global.user_id = registeredUser;
        res.status(200).json({name: registeredUser.name, email: registeredUser.email})
        
        const goodCredentials = await comparePassword(
          password,
          user.hashedPassword,
        );
};

function logoff(req, res) {
    global.user_id = null
    res.status(200).json({message: "You have successfully logged out. See you soon!"})
}

module.exports = {
  register,
  logon,
  logoff
};