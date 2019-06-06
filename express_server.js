var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
const cookieParser =require('cookie-parser')

const morgan = require('morgan');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieParser());

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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

function makeShort(){
  let shortURL = generateRandomString();
  return shortURL;
}

app.get("/register", (req, res) => {
  res.cookie('user_id', '');
  console.log(users[req.cookies.user_id]);
  res.render("urls_reg");
});

app.get("/login", (req,res) =>{
  let templateVars = {
    user: users[req.cookies.user_id],
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
    user: users[req.cookies.user_id],
  //  database: users,
  }
  res.render("urls_index", templateVars);
  console.log( users);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id],
  }
  res.render("urls_new", templateVars);
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  // console.log("email: ",email);
  // console.log("password: ",password);
  if(!checkUsersfor(email)){
    console.log('email not in database')
    res.status(403);
    res.send('password or email is invalid');
  } else {
    console.log('email IS in database')
    let id = checkUsersfor(email);
    console.log(id);
    if(users[id].password === password){
      res.cookie('user_id', id)
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
  let password = req.body.password;

  if(email === '' || password === '' || checkUsersfor(email)){
    res.status(400)
    res.send('Invalid email or password');
  } else {
    let id = generateRandomString();
    // console.log("id: ",id);
    users[id] = {
      "id" : '',
      "email" : '',
      "password" : '',
    }
    users[id]['id'] = id;
    users[id]['email'] = email;
    users[id]['password'] = password;

     console.log( users);

    res.cookie('user_id', id)
    res.redirect('/urls');
  }
})

app.post("/logout", (req, res) => {
  res.cookie('user_id', '')
  res.redirect('/urls');

  console.log('Cookies: ', req.cookies)
  console.log(users);
})

app.post("/urls/:short/update", (req, res) =>{
  let short = req.params.short
  console.log(short);
  urlDatabase[short] = req.body.newLong;
  res.redirect(`/urls/${short}`);
})

app.post("/urls/:short/delete", (req, res) => {
  delete urlDatabase[req.params.short];
  res.redirect('/urls');
})

app.post("/urls", (req, res) => {
  let short = makeShort();
  let exist = false;
  for(key in urlDatabase){
    if(urlDatabase.key === req.body.longURL){
      exist = true
      break
    }
  }
  if(exist === false){
    urlDatabase[short] = req.body.longURL;
    // console.log('works');  // Log the POST request body to the console
    res.redirect(`/urls/${short}`)
  } else {
    res.redirect(`/urls/`)
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  }
  res.render("urls_show", templateVars);
  // res.redirect(templateVars.longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

/*  <p><% var shortURLs = urls.key() %></p>
    <% shortURLs.forEach(function(element){ <%>
    <p><% %></p>
    <% }) %> */

