const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080; //default port 8080

// Configuration
app.set("view engine", "ejs");

// Middleware
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// Function generates random string consisting of 6 alphanumeric characters
const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

// Users database object
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Get /
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Get /register -> New user registration page
app.get("/register", (req, res) => {
  res.render("user_registration");
});

// Register new user and store in users object
app.post("/register", (req, res) => {
  // If either the email or password input is empty, return error 400
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Please provide an email and a password.");
  }
  // If someone tries to register with an existing email address, return error 400
  for (let userID in users) {
    if (users[userID]["email"] === req.body.email) {
      return res.status(400).send("Email is already in use.");
    }
  }

  const userID = generateRandomString();
  users[userID] = {};
  users[userID]["id"] = userID;
  users[userID]["email"] = req.body.email;
  users[userID]["password"] = req.body.password;
  res.cookie('user_id', userID);
  res.redirect("/urls");
});

// Get /login -> User login page
app.get("/login", (req, res) => {
  res.render("user_login");
});

// Get /urls -> My URLs page
app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render("urls_index", templateVars);
});

// Create cookie to save login username
app.post("/login", (req, res) => {
  for (let userID in users) {
    // If the email does not exist, return error 
    if (users[userID]["email"] !== req.body.email) {
      return res.status(403).send("Email address does not exist.");
    }
    // If the email exists but the password is incorrect, return error
    if (users[userID]["email"] === req.body.email && users[userID]["password"] !== req.body.password) {
      return res.status(403).send("Password is incorrect.");
    }
    // If the email exists and the password is correct, create a user_id cookie and redirect to My URLs page
    if (users[userID]["email"] === req.body.email && users[userID]["password"] === req.body.password) {
      res.cookie('user_id', userID);
      res.redirect("/urls");
    }
  }
});

// Logout and clear username cookie
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

// Get /urls/new -> New Short URL page
app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
});

// Generate short URL and redirect to short URL page
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(302, `/urls/${shortURL}`);
});

// Get /urls/:id -> short URL page
app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user,
  };
  res.render("urls_show", templateVars);
});

// Use short URL to redirect to corresponding long URL webpage
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[`${req.params.id}`];
  res.redirect(longURL);
});

// Update short URL to correspond to a different long URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect("/urls");
});

// Delete short URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
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