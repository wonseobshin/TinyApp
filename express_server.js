const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
//const cookieParser =require('cookie-parser')
const cookieSession = require('cookie-session');
const bcrypt =require('bcrypt-nodejs')


var salt = bcrypt.genSaltSync(10);
const morgan = require('morgan');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2', 'key3'],
  maxAge: 24*60*60*1000 //24hrs
}));

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
}

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
}

function checkUsersfor(email){
  for(let id in users){
    if(users[id].email === email)
      return id
  }
  return false;
}

app.get("/register", (req, res) => {
  req.session.user_id = '';
  res.render("urls_reg");
});

app.get("/login", (req,res) =>{
  let templateVars = {
    user: users[req.session.user_id],
    database: users,
  }
  res.render("login", templateVars)
})

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id],
  }
  res.render("urls_index", templateVars);
    console.log(templateVars);

  console.log( users);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
   user : users[req.session.user_id],
  }

  if(users[req.session.user_id] === undefined){
    res.status(400)
    res.send('Please log in to use this function')
  } else {
    res.render("urls_new", templateVars);
  }
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = bcrypt.hashSync(req.body.password, salt);
  if(!checkUsersfor(email)){
    console.log('email not in database')
    res.status(403);
    res.send('password or email is invalid');
  } else {
    console.log('email IS in database')
    let id = checkUsersfor(email);
    console.log(id);
    if(bcrypt.compareSync(req.body.password, users[id].password)){
      req.session.user_id = id;
      res.redirect('/urls');
    } else {
      console.log('password does not match')
      res.status(403);
      res.send('password or email is invalid');
    }
  }
})

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = bcrypt.hashSync(req.body.password, salt);

  if(email === '' || req.body.password === '' || checkUsersfor(email)){
    res.status(400)
    res.send('Invalid email or password');
  } else {
    let id = generateRandomString();
    users[id] = {
      "id" : '',
      "email" : '',
      "password" : '',
    }
    users[id]['id'] = id;
    users[id]['email'] = email;
    users[id]['password'] = password;

    req.session.user_id = id;
    res.redirect('/urls');
  }
})

app.post("/logout", (req, res) => {
  req.session.user_id = '';
  res.redirect('/urls');
})

app.post("/urls/:short/update", (req, res) =>{
  var short = req.params.short
  console.log("CREATOR IS: ", urlDatabase[short].userID)
  console.log("CURRENT USER IS: ", users[req.session.user_id])
  console.log("CURRENT LONG: ", urlDatabase[short].longURL)
  console.log("NEW LONG: ", req.body.newLong)

  if(urlDatabase[short].userID === users[req.session.user_id].id){
    urlDatabase[short].longURL = req.body.newLong;
  } else {
    console.log("YIKES");
  }
  res.redirect(`/urls/`);
})

app.post("/urls/:short/delete", (req, res) => {
  var short = req.params.short;
  console.log("SHORT IS THIS RIGHT HERE HAHA",short);

  if(urlDatabase[short].userID === users[req.session.user_id].id){
    delete urlDatabase[req.params.short];
  } else {
    console.log("YIKES");
  }
  res.redirect(`/urls/`);
})

app.post("/urls", (req, res) => {
  var exist = false;

  for(let key in urlDatabase){
    if(urlDatabase[key].longURL === req.body.longURL){
      exist = true
      break
    }
  }
  if(exist === false){
    let short = generateRandomString();
    console.log(short);
    console.log(req.body.longURL)
    urlDatabase[short]={longURL : '', userID : ''}
    urlDatabase[short].longURL = req.body.longURL;
    urlDatabase[short].userID = req.session.user_id;
    console.log(urlDatabase)
    res.redirect(`/urls/${short}`)
  } else {
    res.redirect(`/urls/`)
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
  }
  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


