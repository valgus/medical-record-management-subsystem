const express = require('express');
const passport = require('passport');

const router = new express.Router();


router.post('/login', (req, res, next) => {
  console.log("login");

  return passport.authenticate('local', (err, user) => {
    console.log(err, user);
      if(err || !user) return res.status(401).json({error: 'Failed to login'})
      return res.json(user);
    })(req, res, next);
  });



module.exports = router;
