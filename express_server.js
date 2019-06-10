const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
//for future dev use
const morgan = require('morgan');
app.use(morgan('dev'));
//required to pull information
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
//cookies for sessions tracking
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2', 'key3'],
  maxAge: 24*60*60*1000 //24hrs
}));
//Hash for passwords
const bcrypt =require('bcrypt-nodejs');
var salt = bcrypt.genSaltSync(10);
//RESTfulness for PUT and DELETE requests
var methodOverride = require('method-override');
app.use(methodOverride('_method'));

const view = './views/'
app.set('view engine', 'ejs');

//improvised code from stackOverflow https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function generateRandomString() {
   var rand           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   for ( var i = 0; i < 6; i++ ) {
      rand += characters.charAt(Math.floor(Math.random() * characters.length));
   }
   return rand;
};

function checkUsersfor(email){
  for(let id in users){
    if(users[id].email === email)
      return id
  }
  return false;
};

//database for users for and urls created
var urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "sh9r87"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "q2f5Ka"},
};

var users = {
  "user1": {
    id: "user1",
    email: "user@example.com",
    password: "pass1"
  },
  "user2": {
    id: "user2",
    email: "user2@example.com",
    password: "pass2"
  },
};

//GET req to the registration page
app.get("/register", (req, res) => {
  req.session.user_id = '';
  res.render("urls_reg");
});

//GET req to the login page
app.get("/login", (req,res) =>{
  let templateVars = {
    user: users[req.session.user_id],
    database: users,
  }
  res.render("login", templateVars)
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//GET req for the main URLs page
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id],
  }
  res.render("urls_index", templateVars);
});

//GET req for the create new URL page
app.get("/urls/new", (req, res) => {
  let templateVars = {
   user : users[req.session.user_id],
  }
  //user must be logged in to view this page
  if(users[req.session.user_id] === undefined){
    res.status(400)
    res.send('Please log in to use this function')
  } else {
    res.render("urls_new", templateVars);
  }
});

//POST to verify login and redirect to URL if it's verified
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = bcrypt.hashSync(req.body.password, salt);
  if(!checkUsersfor(email)){
    //check if user already exist in the database
    res.status(403);
    res.send('password or email is invalid');
  } else {
    //check if hashed password matches using bcrypt
    let id = checkUsersfor(email);
    if(bcrypt.compareSync(req.body.password, users[id].password)){
      req.session.user_id = id;
      res.redirect('/urls');
    } else {
      res.status(403);
      res.send('password or email is invalid');
    }
  }
});

//POST to register new user
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = bcrypt.hashSync(req.body.password, salt);

  //check for invalid input
  if(!email || req.body.password === '' || checkUsersfor(email)){
    res.status(400);
    res.send('Invalid email or password');
  } else {
    let id = generateRandomString();
    users[id] = {
      "id" : '',
      "email" : '',
      "password" : '',
    };
    users[id]['id'] = id;
    users[id]['email'] = email;
    users[id]['password'] = password;

    req.session.user_id = id;
    res.redirect('/urls');
  }
});

//POST to log user out
app.post("/logout", (req, res) => {
  req.session.user_id = '';
  res.redirect('/urls');
});

//PUT to update URL
app.put("/urls/:short/update", (req, res) =>{//removed /update
  var short = req.params.short;

  if(urlDatabase[short].userID === users[req.session.user_id].id){
    urlDatabase[short].longURL = req.body._method;
  } else {
    res.status(400);
    res.send('Please log in to use this function');
  }
  res.redirect(`/urls/${short}`);
});

//DELTE to delete URL
app.delete("/urls/:short/delete", (req, res) =>{
  var short = req.params.short;

  if(urlDatabase[short].userID === users[req.session.user_id].id){
    delete urlDatabase[req.params.short];
  } else {
    res.status(400);
    res.send('Please log in to use this function');
  }
  res.redirect(`/urls/`);
});

// POST request to displace URLs
app.post("/urls", (req, res) => {
  var exist = false;

  // check if URL already exists in the database
  for(let key in urlDatabase){
    if(urlDatabase[key].longURL === req.body.longURL){
      exist = true;
      break;
    }
  }
  //if not, redirect to the new URL show page
  if(exist === false){
    let short = generateRandomString();
    urlDatabase[short]={longURL : '', userID : ''}
    urlDatabase[short].longURL = req.body.longURL;
    urlDatabase[short].userID = req.session.user_id;
    res.redirect(`/urls/${short}`);
  } else {
    //else stay
    res.redirect(`/urls/`);
  }
});

//GET to use shortened URL to redirect to the actual URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//GET to display short url and show options
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
  }

  if(users[req.session.user_id] === undefined){
    res.status(400);
    res.send('Please log in to use this function');
  } else {
    res.render("urls_show", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


