const express = require('express');
const passport = require('passport');

const enc = require('../services/encryption');
const async = require('async');
const nodemailer = require('nodemailer');
const ObjectId = require('mongodb').ObjectID;

const router = new express.Router();


router.get('/all', (req, res, next) => {
    const id = req.query.id;
    let details = { '_id':new ObjectId(id) };
    const result = { members : [], employees : []};

    async.waterfall([
    function(callback) {
      req.app.get("db").collection('users').findOne(details, (err, user) => {
        if (err || !user) {
          console.log(err, 1);
          return  res.status(500).json({error: 'Error during user finding.'});
        }
        callback(null, user);
      });
    },
    function(user, callback) {
      if (user.members) {
        req.app.get("db").collection('users').find(
        {  _id: { $in: user.members }}, {fields:{password: 0, members:0}}).toArray((err, members) => {
          if (err) {
            return  res.status(500).json({error: 'Error during members finding.'});
          }
          console.log(members);
          result.members = members;
          callback(null);
        });
      }
    },
    function(callback) {
      req.app.get("db").collection('employees').find({ heads: id }, {fields:{password: 0, heads : 0}}).toArray((err, employees) => {
          if (err) {
            return  res.status(500).json({error: 'Error during employees finding.'});
          }
          if (employees) {
            result.employees = employees
          }
          callback(null);
        });
    }
], function (err) {
    res.status(200).json(result);
});
});

router.post('/saveMember', (req, res, next) => {
    const member = req.body;
    let details = { 'username':member.email };
    let userToAdd;
    let resMembers = [];
    async.waterfall([
      //Try to find a member in db
      function(callback) {
        req.app.get("db").collection('users').findOne(details, (err, result) => {
          if (err) {
            console.log(err, 1);
            return  res.status(500).json({error: 'Error during member finding.'});
          }
          callback(null, result);
        });
      },
      //If member is found - ok, else create new member in db
      function(user, callback) {
        if (!user) { //user with such username does not exist
          const pass = Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
          sendMail(member.email, pass);
          console.log(member.email, ' is new user. Its password is ', pass);
          const encPass = enc.encrypt(pass, member.email);
          details = { 'username': member.email, 'password': encPass, level: 1 };
          req.app.get("db").collection('users').insert(details, (err2, result2) => {
            if (err2 || !result2) {
              console.log(err2, '2');
              return  res.status(500).json({error: 'Error during member creation.'});
            }
            userToAdd = result2.ops[0]; //result2 is a large object that has additional information about insertion
            callback(null);
          });
        } else {
          userToAdd = user; //existed user
          callback(null);
        }
      },
      //Find current user in db, add new member to it, update in db
      function(callback) {
        details = {"_id": new ObjectId(member.headId)}
        req.app.get("db").collection('users').findOne(details, (err3, result3) => {
          if (err3 || !result3) {
            console.log(err, result3);
            return  res.status(500).json({error: 'Error during user finding.'});
          }
          const members = (result3.members) ? result3.members : [];
          if (!contains(members, userToAdd._id)) {
            members.push(userToAdd._id)
          } else {
            console.log('Such a member is already added to this user.');
            return res.status(450).json({error: 'Such a member has already an access to your department.'});
          }
          req.app.get("db").collection('users').findOneAndUpdate({ _id: result3._id }, {
            $set: { members: members }
          }, (err, result4) => {
              if (err) {
                console.log(err);
                return  res.status(500).json({error: 'Error during user updating.'});
              }
              callback(null, result4.value.members);
          });
        });
      },
      //Get all members linked to the current user
      function(allMembers, callback) {
        if (allMembers) {
          req.app.get("db").collection('users').find(
          {  _id: { $in: allMembers }}, {fields:{password: 0, members:0}}).toArray((err, members) => {
            if (err) {
              return  res.status(500).json({error: 'Error during members finding.'});
            }
            resMembers = members;
            resMembers.push(userToAdd);
            callback(null);
          });
        } else {
          callback(null);
        }
      }
    ], function (err) {
        res.status(200).json({ err: err, emails: resMembers});
    });
});


router.post('/saveEmployee', (req, res, next) => {
    const employee = req.body;
    let details = { 'username':employee.email };
    let userToAdd;
    let resEmployees = [];
    async.waterfall([
      //Try to find employee with the given username
      function(callback) {
        req.app.get("db").collection('employees').findOne(details, (err, result) => {
          if (err) {
            console.log(err, 1);
            return  res.status(500).json({error: 'Error during employee finding.'});
          }
          callback(null, result)
        });
      },
      function(user, callback) {
        if (!user) { //user with given username does not exist
          console.log(employee.email, ' is new user');
          const pass = Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
          sendMail(employee.email, pass);
          const encPass = enc.encrypt(pass, employee.email);
          console.log('pass', pass);
          details = { 'username': employee.email, 'password': encPass };
          req.app.get("db").collection('employees').insert(details, (err2, result2) => {
            if (err2 || !result2) {
              console.log(err2, '2');
              return  res.status(500).json({error: 'Error during employee creation.'});
            }
            userToAdd = result2.ops[0]; //result2 is a large object that has additional information about insertion
            callback(null);
          });
        } else {
          userToAdd = user; //existed user
          callback(null);
        }
      },
      //add to this employee the head
      function(callback) {
        const heads = (userToAdd.heads) ? userToAdd.heads : [];
        if (!contains(heads, employee.headId)) {
          heads.push(employee.headId);
        } else {
          console.log('Such an employee is already added to this user.');
          return res.status(401).json({error: 'Such an employee has already an access to your department.'});
        }
        req.app.get("db").collection('employees').update({ _id: userToAdd._id }, {
          $set: { heads: heads }
        }, (err, result4) => {
            if (err) {
              console.log(err);
              return  res.status(500).json({error: 'Error during user updating.'});
            }
            callback(null);
          });
        },
        //get all usernames of employees who are linked to the user
        function(callback) {
          req.app.get("db").collection('employees').find({ heads: employee.headId },
            {fields:{password: 0, heads : 0}}).toArray((err, employees) => {
              if (err) {
                return  res.status(500).json({error: 'Error during employees finding.'});
              }
                if (employees) {
                  resEmployees = employees;
                }
                callback(null);
            });
        }
    ], function (err) {
        res.status(200).json({ err: err, emails: resEmployees});
    });
});


router.post('/deleteEmployee', (req, res, next) => {
    const employee = req.body;
    let details = {  '_id':new ObjectId(employee.id)  };
    console.log(employee.headId);
    req.app.get("db").collection('employees').findOneAndUpdate(details,
        { $pull: { 'heads': employee.headId }}, (err, emp) => {
          console.log(emp);
      if (emp.value.heads.length === 1) {
        req.app.get("db").collection('employees').remove(details, (err, result) => {
          if (err || !result) {
              console.log(err);
              return  res.status(500).json({error: 'Error during employee remove.'});
          }
      });
    }
    details = {heads: employee.headId};
    req.app.get("db").collection('employees').find(details,
    {fields:{password: 0, heads : 0}}).toArray((err, employees) => {
        if (err) {
          return  res.status(500).json({error: 'Error during employees finding.'});
        }
          return res.status(200).json({err, emails: employees});
      });
    });
});

router.post('/deleteMember', (req, res, next) => {
    const member = req.body;
    console.log(member);
    let details = {  '_id':new ObjectId(member.id)  };

req.app.get("db").collection('users').find({ 'members': new ObjectId(member.id) }).count((err, number) => {
console.log(number);
  if (err) {
    console.log(err);
    return  res.status(500).json({error: 'Error during member remove.'});
  }
  if (number === 1) { //remove only in the case when the member is linked only to this user
    req.app.get("db").collection('users').remove(details, (err, result) => {
     if (err || !result) {
         console.log(err);
         return  res.status(500).json({error: 'Error during member remove.'});
     }
   });
  }
  details = {  '_id':new ObjectId(member.headId)};
  req.app.get("db").collection('users').findOneAndUpdate(details,
      { $pull: { 'members': new ObjectId(member.id) }}, (err, result) => {
        if (err) {
          console.log(err);
          return  res.status(500).json({error: 'Error during user update.'});
        }
        console.log(result.value.members);
        req.app.get("db").collection('users').find(
        {
          _id: { $in: result.value.members }
        }, {fields:{password: 0, members:0}}).toArray((err, members) => {
          if (err) {
            return  res.status(500).json({error: 'Error during members finding.'});
          }
          const removeIndex = members.map(function(item) { return item._id; }).indexOf(member.id);
          if (removeIndex !== -1) {
            members.splice(removeIndex, 1);
          }
          return res.status(200).json({err, emails: members});
        });
      });

});

});

function contains(array, obj) {
    var i = array.length;
    while (i--) {
       if (array[i].toString() === obj.toString()) {
           return true;
       }
    }
    return false;
}

function sendMail(email, password) {
  nodemailer.createTestAccount((err, account) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: "medrecsystemservice@gmail.com", // generated ethereal user
            pass:  "diploma2018"// generated ethereal password
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: 'medrecsystemservice@gmail.com', // sender address
        to: 'gureeva.alexandra@list.ru', // list of receivers
        subject: 'No Reply. Access to the Medical Record Generation System', // Subject line
        text: 'You was granted to get an access to the Medical Record Generation System. To log in in the system, use this link: tratata. You credentials: email:' + email + ', password:  ' + password, // plain text body
        html: 'You was granted to get an access to the Medical Record Generation System. <br>To log in in the system, use this link: tratata. <br>You credentials: <br><b>email:</b> ' + email + ', <br><b>password:</b> ' + password // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
});
}

module.exports = router;
