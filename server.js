const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcryptjs');

const app = express();

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'test',
    database : 'quizup'
  }
});

app.use(cors());
app.use(bodyParser.json());

app.post('/signin', (req,res) => {
  const { email, password } = req.body;
  if(!email || !password){
    return res.status(400).json('Incorrect form submission');
  }
  db.select('email','hash').from('login')
  .where('email','=', email)
  .then( data => {
    const isValid = bcrypt.compareSync(password, data[0].hash);
    if(isValid){
      return db.select('*').from('users')
        .where('email','=',email)
        .then(user => {
          console.log(user[0]);
          res.json(user[0]);
        })
        .catch( err => res.status(400).json('Unable to get user'))
    }else{
      res.status(400).json('Wrong credentials');
    }
  })
  .catch(err => res.status(400).json('Wrong credentials'))
})

app.post('/register', (req,res) => {
  const { email, name, password } = req.body;
  console.log( email, name, password);
  if(!email || !password || !name)
  {
    return res.status(400).json('Incorrect form submission');
  }
  const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {
      return trx('users')
      .returning('*')
      .insert({
        email: loginEmail[0],
        name: name
    })
    .then(user => {
      res.json(user[0]);
      })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
    .catch(err => res.status(400).json('Unable to register'));
})

app.listen(3000);
