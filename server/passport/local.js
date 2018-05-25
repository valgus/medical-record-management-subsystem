const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const request = require('request');

const enc = require('../services/encryption');
const config = require('../config/index');

const async = require('async');

const ObjectId = require('mongodb').ObjectID;
/**
 * Password strategy
 */


 module.exports = new LocalStrategy({
   usernameField: 'username',
   passwordField: 'password',
   session: false,
   passReqToCallback: true
 }, (req, username, password, done) => {
   const details = { 'username':username };
   const response = {username: '', id: ''};

   async.series([
      function(callback) {
        req.app.get("db").collection('employees').findOne(details, (err, result) => {
          console.log('got response');
              if (err) {
                console.log(err);
                callback(err)
              } else {
                callback(null, result)
              }
            });
      },
      function(callback) {
        req.app.get("db").collection('users').findOne(details, (err, result) => {
          console.log('got response');
              if (err) {
                console.log(err);
                callback(err)
              } else {
                callback(null, result)
              }
            });
      }
    ],
    function(err, results) {
      if (err) {
        return done(err);
      }
      console.log(results);
      const result = (results[0]) ? results[0] : results[1];
      if (result) {
        const pass = enc.decrypt(result.password, result.username);
         if ( pass !== password) {
           console.log("Password is wrong");
           return done('Pasword is wrong.');
         }
         response.id =result._id;
         response.username = result.username;
         return done(null, response);
      } else {
        console.log("Not found");
        return done('Such user was not found.')
      }
    });

 });
