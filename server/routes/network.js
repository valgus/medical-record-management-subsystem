const express = require('express');
const passport = require('passport');

const enc = require('../services/encryption');
const async = require('async');
const ObjectId = require('mongodb').ObjectID;
const mime = require('mime-types');
const path = require('path')
const request = require('request');
const keypair = require('keypair');

const config = require("../config/index");
const router = new express.Router();

const generator = require("../services/documentGeneration")


router.get('/confirmations', (req, res, next) => {
  const id = req.query.id;
  req.app.get("db").collection('network').findOne({depId: id}, (err, depInfo) => {
    if (err) {
      return  res.status(500).json({error: 'Error during department information finding.'});
    }
    if (!depInfo) {
      return res.status(200).json(null);
    }
    request(config.blockchainUrl + "/getConfirmations?id=" + depInfo.blockchainId,  (error, response, result) => {
      if (error) {
        console.log(error);
          return res.status(500).json({error: 'Cannot connect to network to get departments information'});
       }
       console.log(result);
       return res.status(200).json(JSON.parse(result));
    });
  });
});


router.post('/download', (req, res, next) => {
    const info = req.body;
    console.log(info);
    req.app.get("db").collection('network').findOne({depId: info.depId}, (err, depInfo) => {
      if (err) {
        console.log(err);
        return  res.status(500).json({error: 'Error during department information finding.'});
      }
      if (!depInfo) {
        console.log("No information according the requesting department");
        return res.status(200).json(null);
      }
      const pair = keypair();
      const options = {
        method: 'post',
        body: {toId: depInfo.blockchainId, fromId: info.fromId, key: pair.public },
        json: true,
        url: info.url + '/download'
      };
      console.log(options);
      request.post(options,  (error, response, data) => {
        console.log(error, data);
        if (error || !data) {
          console.log(error);
            return res.status(500).json({error: 'Cannot connect to network to get data information'});
         }
         generator.generateExcelForDepartment(data, (err, excel) => {
           res.status(200).json(excel);
         })

      });
    });
});

module.exports = router;
