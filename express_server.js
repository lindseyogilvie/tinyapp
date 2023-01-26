const express = require("express");
const app = express();
const PORT = 8080; //default port 8080

app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));

const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

// Render My URLs page
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase};
  res.render("urls_index", templateVars);
});

// Render New Short URL page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
})

// Generate short URL and redirect to short URL page
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(302, `/urls/${shortURL}`);
})

// Render short URL page
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars)
})

// Use short URL to redirect to corresponding long URL webpage
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[`${req.params.id}`];
  res.redirect(longURL);
})

// Update short URL to correspond to a different long URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL; 
  console.log(urlDatabase);
  res.redirect("/urls") 
})

// Delete short URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</></bod></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});