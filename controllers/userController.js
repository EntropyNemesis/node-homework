function register(req, res) {
  //builds the full user object with credentials. req.body is the parsed JSON the client sent, and we are pulling the 3 relevant fields from it.
  const userCredentials = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
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

};

function logoff(req, res) {

}

module.exports = {
  register,
  logon,
  logoff
};