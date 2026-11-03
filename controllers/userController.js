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

  async function register(req, res) {
  //builds the full user object with credentials. req.body is the parsed JSON the client sent, and we are pulling the 3 relevant fields from it.
  /*const userCredentials = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  };  */
    if (!req.body) req.body = {};
    //checking req.body before creating user
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({message: error.message});
  
      // use value.email, value.name, and value.password after this point
  
   const existingUser = global.users.find(user => value.email === user.email)
        if (existingUser) {
            res.status(400).json({message: "A user with that email already exists."})
            return;
        }

  const hashedInitialPassword = await hashPassword(value.password);

  const userCredentials = {
    name: value.name,
    email: value.email,
    hashedPassword: hashedInitialPassword,
  };

  //store the new user creds/profile object in global.users, the temporary in-memory "database" (array). push adds this user to the end.
  global.users.push(userCredentials);

  //mark the user as logged in
  global.user_id = userCredentials;

  // makes a safe copy of the user object without the password. reads as: "from userCredentails, pull password into its own variable and put everything else into a new object called user"
  const {hashedPassword, ...user} = userCredentials;

  //sends the response as JSON
  res.status(201).json(user)
};

async function logon(req, res) {
    const {email, password} = req.body;

    const registeredUser = global.users.find(user => user.email === email)

    const goodCredentials = registeredUser && await comparePassword(
        password,
        registeredUser.hashedPassword,
        );

        if (!goodCredentials) {
            res.status(401).json({message: "Could not log on, due to invalid email or password."})
            return;
        }
      
        global.user_id = registeredUser;
        res.status(200).json({name: registeredUser.name, email: registeredUser.email})
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