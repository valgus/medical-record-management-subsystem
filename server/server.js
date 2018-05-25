const webpack = require('webpack');

const MongoClient = require('mongodb').MongoClient;
const config = require('./config/index');
const passport = require('passport');
const bodyParser = require('body-parser');
const path = require('path');

const express = new require('express');
const port = 4000;

const app = express();

// tell the app to look for static files in these directories
app.use(express.static('./dist/'));
app.use(express.static('./server/static/'));


// tell the app to parse HTTP body messages
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// pass the passport middleware
app.use(passport.initialize());
app.use(passport.session());

// routes
 const authRoutes = require('./routes/auth');
 const emailRoutes = require('./routes/email');
 const depRoutes = require('./routes/department');
 const mrRoutes = require('./routes/medrec');
 const downloadRoutes = require('./routes/download');
 const networkRoutes = require('./routes/network');
 app.use('/auth', authRoutes);
 app.use('/email', emailRoutes);
 app.use('/department', depRoutes);
 app.use('/download', downloadRoutes);
 app.use('/medrec', mrRoutes);
 app.use('/network', networkRoutes);

//load passport strategies
 const localStrategy = require('./passport/local');
 passport.use('local', localStrategy);

// pass the authenticaion checker middleware
// const authCheckMiddleware = require('./middleware/isAuthenticated');
// app.use('/api', authCheckMiddleware);

app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname+'/static/index.html'));
});


MongoClient.connect(config.generationdbMongoUrl, (err, database) => {
  if (err) return console.log(err);
  const medrecDb = database.db('med-rec-generation');
  app.set('db',medrecDb);
  MongoClient.connect(config.managementdbMongoUrl, (err, database2) => {
    if (err) return console.log(err);
    const patientDb = database2.db('med-rec-management');
    app.set('patientdb', patientDb);

    app.listen(port, function(error) {
      if (error) {
        console.error(error);
      } else {
        console.info('==> ??  Open up http://localhost:%s/ in your browser.', port);
      }
    });
  });
})
