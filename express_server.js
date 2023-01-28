const express = require("express");
const app = express();
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const PORT = 8080; //default port 8080

// Configuration
app.set("view engine", "ejs");

// Middleware
app.use(express.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Key 1', 'Key 2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Helper Functions
const getUserByEmail = require('./helpers');

// Function generates random string consisting of 6 alphanumeric characters
const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

// Users database object
const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  aJ48lU: {
    id: "aJ48lU",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lU",
  },
  i7H4F3: {
    longURL: "https://www.apple.ca",
    userID: "aJ48lW",
  },
};

const urlsForUser = function(id) {
  const userUrls = {};
  for (const urls in urlDatabase) {
    const url = urlDatabase[urls];
    if (url.userID === id) {
      userUrls[urls] = url;
    }
  }
  return userUrls;
};

// Get /
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Get /register -> New user registration page
app.get("/register", (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user,
  };
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("user_registration", templateVars);
  }
});

// Register new user and store in users object
app.post("/register", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  // If either the email or password input is empty, return error 400
  if (!userEmail || !userPassword) {
    return res.status(400).send("Please provide an email and a password.");
  }
  // If someone tries to register with an existing email address, return error 400
  for (let userID in users) {
    if (getUserByEmail(userEmail, users)) {
      return res.status(400).send("Email is already in use.");
    }
  }

  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  users[userID] = {};
  users[userID]["id"] = userID;
  users[userID]["email"] = email;
  users[userID]["password"] = hashedPassword;
  req.session.user_id = userID;
  res.redirect("/urls");
});

// Get /login -> User login page
app.get("/login", (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user,
  };
  // If user is already logged in and they try to access login page, redirect them to /urls
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("user_login", templateVars);
  }
});

// Get /urls -> My URLs page
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  // User cannot see /urls page unless they are logged in
  if (!user) {
    return res.status(401).send("Please login to see urls");
  }
  const userUrls = urlsForUser(user.id);
  const templateVars = {
    urls: userUrls,
    user,
  };
  res.render("urls_index", templateVars);
});

// Login and create cookie
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  // If the email does not exist, return error
  if (!user) {
    return res.status(403).send("Email address does not exist.");
  }
  // If the email exists but the password is incorrect, return error
  if (user && bcrypt.compareSync(password, user.password) === false) {
    return res.status(403).send("Password is incorrect.");
  }
  // If the email exists and the password is correct, create a user_id cookie and redirect to My URLs page
  if (user && bcrypt.compareSync(password, user.password) === true) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  }
});

// Logout and clear user_id cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Get /urls/new -> New Short URL page
app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user,
  };
  // If user is not logged in, redirect them to the login page
  if (!user) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

// Generate short URL and redirect to short URL page
app.post("/urls", (req, res) => {
  const user = users[req.session.user_id];
  // If user is not logged in, return status code 401 - Unauthorized
  if (!user) {
    return res.status(401).send("You must be logged in to see this page");
  } else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    const userID = user.id;
 
    urlDatabase[shortURL] = {longURL, userID};
    res.redirect(302, `/urls/${shortURL}`);
  }
});

// Get /urls/:id -> short URL page
app.get("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  const urlUserID = urlDatabase[req.params.id].userID;
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user,
  };
  if (!user) {
    return res.status(401).send("You must be logged in to see this page.");
  } else if (user.id !== urlUserID) {
    return res.status(401).send("You can only view your own urls.");
  } else {
    res.render("urls_show", templateVars);
  }
});

// Use short URL to redirect to corresponding long URL webpage
app.get("/u/:id", (req, res) => {
  // If short URL does not exist, return status code 400 - Bad Request
  if (!urlDatabase[req.params.id]) {
    res.status(400).send("Short URL does not exist");
  } else {
    const longURL = urlDatabase[`${req.params.id}`].longURL;
    res.redirect(longURL);
  }
});

// Update short URL to correspond to a different long URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    return res.status(400).send("This url does not exist.");
  }

  const user = users[req.session.user_id];
  const urlUserID = urlDatabase[req.params.id].userID;
  if (!user) {
    return res.status(401).send("You must be logged in to edit this url.");
  } else if (user.id !== urlUserID) {
    return res.status(401).send("You can only edit your own urls.");
  } else {
    urlDatabase[id].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

// Delete short URL
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    return res.status(400).send("This url does not exist.");
  }

  const user = users[req.session.user_id];
  const urlUserID = urlDatabase[req.params.id].userID;
  if (!user) {
    return res.status(401).send("You must be logged in to delete this url.");
  } else if (user.id !== urlUserID) {
    return res.status(401).send("You can only delete your own urls.");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</></bod></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});