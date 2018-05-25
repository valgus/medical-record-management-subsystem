const express = require('express');
const passport = require('passport');

const enc = require('../services/encryption');
const generator = require("../services/documentGeneration")
const async = require('async');
const ObjectId = require('mongodb').ObjectID;
const mime = require('mime-types');
const path = require('path')
const router = new express.Router();

var imaps = require('imap-simple');


router.get('/', (req, res, next) => {
  const id = req.query.id;
  console.log(id);
  //run retrieving attachments from the mail
  getNewAttachments(req);
  req.app.get("db").collection('departments').findOne( {_id: new ObjectId(id)}, (err, result) => {
    if (err || !result) {
      console.log(err);
      return  res.status(500).json({error: 'Error during medical records extraction.'});
    }
    const department = {};
    department.name = result.name;
    req.app.get("patientdb").collection('medrecs').find( {depId: id}).toArray((err, medrecs) => {
      if (err) {
        console.log(err);
        return  res.status(500).json({error: 'Error during medical records extraction.'});
      }
      department.medrecs = medrecs.reverse();
      const mrIds = [];
      let openMedRecNumber = 0;
      for (const medrec of medrecs) {
        mrIds.push(new ObjectId(medrec._id));
        if (medrec.isOpened) {
          openMedRecNumber ++;
        }
      }
      const closedMedRecNumber = medrecs.length - openMedRecNumber;
      req.app.get('patientdb').collection('mrelements').find({"mrId": {$in : mrIds}}).toArray((err, mrelements) => {
        if (err) {
          return  res.status(500).json({error: 'Error during medical records extraction.'});
        }
        const incompleteOvalues = [];
        const openQuestionnaires = [];
        const openTemplates = [];
          async.each(mrelements, function(element, callback) {
            if (element.type === 2 && !element.isComplete) {
                req.app.get("patientdb").collection('observedvalues').findOne( {_id: new ObjectId(element._id)}, (err, ovalue) => {
                  if (err) {
                    callback('Error during observed value information retrieveing.');
                  }
                  const missedOValues = [];
                  let timetoset = ovalue.lastUpdate;
                  const toDate = (ovalue.completeDate) ? ovalue.completeDate : Date.now();
                  while (timetoset < toDate) {
                    missedOValues.push(timetoset);
                    timetoset = timetoset + ovalue.frequency;
                  }
                  const alreadyInObValue = [];
                  console.log("missed", missedOValues);
                  console.log("observings", ovalue.observings);
                  if (ovalue.observings && ovalue.observings.length > 0) {
                    for (const index in missedOValues) {
                      if (ovalue.observings.filter(x => x.date === missedOValues[index]).length > 0) {
                        alreadyInObValue.push(index);
                      }
                    }
                  }
                  if (missedOValues.length - alreadyInObValue.length > 0) {
                    incompleteOvalues.push({
                      id: element._id,
                      name: element.name,
                      mrId: element.mrId,
                      mrName: medrecs.filter(x => x._id.toString() === element.mrId.toString())[0].number,
                      times: missedOValues.length - alreadyInObValue.length });
                  }
                  callback();
                });
            } else  if (element.type === 0) {
              console.log(element);
              if (!element.isComplete) {
                console.log(element);
                openQuestionnaires.push({name: element.name, id: element._id,  mrId: element.mrId, mrName: medrecs.filter(x => x._id.toString() === element.mrId.toString())[0].number});
              }
              callback();
            } else  if (element.type === 1) {
              if (!element.isComplete) {
                  openTemplates.push({name: element.name, id: element._id,  mrId: element.mrId, mrName: medrecs.filter(x => x._id.toString() === element.mrId.toString())[0].number});
              }
              callback();
            } else {
              callback();
            }
          }, function(err) {
            if (err) {
                return  res.status(500).json({error: 'Error during medical record elements finding.'});
            }
                department.elementsInfo = {};
                department.elementsInfo.incompleteOvalues = incompleteOvalues;
                department.elementsInfo.openQuestionnaires = openQuestionnaires;
                department.elementsInfo.openTemplates = openTemplates;
                department.elementsInfo.closedMedRecNumber = closedMedRecNumber;
                department.elementsInfo.openMedRecNumber = openMedRecNumber;
                return res.status(200).json(department);
          });
        });
    });
  });
});

router.get('/all', (req, res, next) => {
  const id = req.query.id;
  console.log(id);
  async.series([
      function(callback) {
        req.app.get("db").collection('employees').findOne( {_id: new ObjectId(id)}, (err, employee) => {
          if (err) {
            console.log(err);
            callback(err);
          }
          if (employee && employee.heads) {
            req.app.get("db").collection('departments').find( {headId: { $in: employee.heads }}).toArray((err, departments) => {
              if (err) {
                console.log(err);
                callback(err);
              }
              callback(null, departments);
            });
          } else {
            callback(null, null);
          }
        });
      },
      function(callback) {
        req.app.get("db").collection('users').findOne( {_id: new ObjectId(id)}, (err, user) => {
          if (err) {
            console.log(err);
            callback(err);
          }
          if (user) {
            req.app.get("db").collection('departments').find( {headId: id}).toArray((err, departments) => {
              if (err) {
                console.log(err);
                callback(err);
              }
              callback(null, departments);
            });
          } else {
            callback(null, null);
          }
        });
      }
  ],
  // optional callback
  function(err, results) {
    if (err) {
      return res.status(500).json({error: "Error during departments finding occured."})
    }
    const departments = (results[0]) ? results[0] : results[1];
    console.log(results);
    if (departments) {
        return res.status(200).json(departments);
    } else {
      return res.status(200).json([]);
    }

  });

});



router.post('/', (req, res, next) => {
  const medrec = req.body;
  req.app.get("patientdb").collection('medrecs').insert( medrec, (err, result) => {
    if (err) {
      return  res.status(500).json({error: 'Error during new medical record creation.'});
    }
    console.log("inserted medrec: ", result);
    req.app.get("db").collection('mrelements').find({depId: medrec.depId, "type": 3}).toArray((err2, folders) => {
      if (err2) {
        console.log(err2);
        return  res.status(500).json({error: 'Error during new medical record creation.'});
      }
      const medrecFolders = [];
      for (const folder of folders ) {
        medrecFolders.push({
          initialId: folder._id,
          name: folder.name,
          type: 3,
          mrId: result.ops[0]._id
        });
      }
      if (medrecFolders.length > 0) {
        req.app.get("patientdb").collection('mrelements').insert( medrecFolders, (err3, result2) => {
            if (err3) {
              console.log(err3);
              return  res.status(500).json({error: 'Error during new medical record creation.'});
            }
            req.app.get("patientdb").collection('medrecs').find({depId: medrec.depId}).toArray((err4, medrecs) => {
              if (err4 || !medrecs) {
                console.log(err4);
                return  res.status(500).json({error: 'Error during departments finding.'});
              }
              return res.status(200).json(medrecs);
            });
          });
      } else {
        req.app.get("patientdb").collection('medrecs').find({depId: medrec.depId}).toArray((err4, medrecs) => {
          if (err4 || !medrecs) {
            console.log(err4);
            return  res.status(500).json({error: 'Error during departments finding.'});
          }
          return res.status(200).json(medrecs);
        });
      }
      });
  });
});


router.get('/userAll', (req, res, next) => {
  const id = req.query.id;
  const details = {headId: id}
  req.app.get("db").collection('departments').find(details).toArray((err, departments) => {
    if (err) {
      return  res.status(500).json({error: 'Error during departments finding.'});
    }
    return res.status(200).json({departments});
  });
});


router.post('/delete', (req, res, next) => {
    const department = req.body;
    console.log(department);
    let details = {  '_id':new ObjectId(department.id)  };
    return req.app.get("db").collection('departments').remove(details, (err, result) => {
      if (err || !result) {
          console.log(err);
          return  res.status(500).json({error: 'Error during department remove.'});
      }
      req.app.get("db").collection('departments').find().toArray((err2, departments) => {
        if (err2) {
          return  res.status(500).json({error: 'Error during departments finding.'});
        }
        return res.status(200).json(departments);
      });
    });
});


router.post('/setName', (req, res, next) => {
    const department = req.body;
    let details = {  '_id':new ObjectId(department.id)  };
    delete department.id;
    return req.app.get("db").collection('departments').update(details, { $set: department},  (err, result) => {
      if (err || !result) {
          console.log(err);
          return  res.status(500).json({error: 'Error during department name updating.'});
      }
        return res.status(200).json("ok");
      });
});


router.post('/download', (req, res, next) => {
    const department = req.body;
    console.log(department);
    req.app.get("patientdb").collection('medrecs').find({depId: department.depId}, {fields:{_id: 1}}).toArray((err, medrecs) => {
      if (err) {
        console.log(err);
        return res.status(500).json({error: 'Error during data retrievng occured.'});
      }
      console.log(medrecs);
      if (!medrecs || medrecs.length === 0) {
        return res.status(200).json([]);
      }
      let ids = [];
      for (const medrec of medrecs) {
        ids.push(new ObjectId(medrec._id));
      }
      console.log(ids);
      req.app.get("patientdb").collection('mrelements').find({mrId:  { $in: ids }, type: {$in : [0,2]}}, {fields:{_id: 1, name: 1, mrId: 1, type: 1}}).toArray((err, elements) => {
        if (err) {
            console.log(err);
            return res.status(500).json({err: "Error during data extracting occured."})
        }
        console.log(elements);
        ids = elements.map(el => el._id);
        async.series([
            function(callback) { //extracting observed values
                    req.app.get("patientdb").collection('observedvalues').find({_id : { $in: ids }}, {fields:{showGraph: 0}}).toArray((err, ovalues) => {
                      if (err) {
                        console.log(err);
                        callback({err: "Error during data extracting occured."})
                      }
                      callback(null, {ovInfo: elements.filter(el => el.type === 2), ovDetails: ovalues});
                    });
            }, //extracting questionnaire
            function(callback) {
                  req.app.get("patientdb").collection('questionnaires').find({_id : { $in: ids }}, {fields:{"questions.hidden": 0, "questions.linkIndex": 0, "questions.linkAnswer": 0}}).toArray((err, qs) => {
                    if (err) {
                      console.log(err);
                      callback({err: "Error during data extracting occured."})
                    }
                    callback(null, {qInfo: elements.filter(el => el.type === 0), qDetails: qs});
                  });
            }
        ],
        function(err, result) {
            if (err) {
              return res.status(500).json(err);
            }
            const data = {ovalues: result[0], questionnaires: result[1]};
            console.log(JSON.stringify(data, null, 2));
            generator.generateExcelForDepartment(data, (err, excel) => {
              res.status(200).json(excel);
            });
        });
      });
    })
});


function getNewAttachments(req) {
  console.log('-------------------GET NEW ATTACHMENTS--------------------------------');

  var config = {
    imap: {
      user: "medrecsystemservice@gmail.com", // generated ethereal user
      password:  "diploma2018",
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 3000
    }
};

imaps.connect(config).then(function (connection) {

    connection.openBox('INBOX').then(function () {

        var searchCriteria = ['UNSEEN'];
        var fetchOptions = { bodies: ['HEADER'], struct: true, markSeen: true };

        // retrieve only the headers of the messages
        return connection.search(searchCriteria, fetchOptions);
    }).then(function (messages) {

        let attachments = [];
        messages.forEach(function (message) {
            const parts = imaps.getParts(message.attributes.struct);


            const header = message.parts.filter(function (part) {
                    return part.which === 'HEADER';
                })[0].body;
            const subject = header.subject[0];
            const date = Date.parse(header.date);
            const from = header.from[0];
                attachments = attachments.concat(parts.filter(function (part) {
                    return part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT';
                }).map(function (part) {
                    // retrieve the attachments only of the messages with attachments
                    return connection.getPartData(message, part)
                        .then(function (partData) {
                          let filename = part.disposition.params.filename;
                          if (filename.startsWith("=?UTF-8?")) {
                            console.log(filename);
                            filename = filename.replace(/=\?UTF-8\?[\w]*\?/, '');
                            filename = filename.substring(0, filename.length - 2);
                            console.log(filename);
                            filename = Buffer.from(filename, 'base64').toString('utf8');
                          }
                          let temp = partData.toString().length;
                          let i = 0;
                          while (temp/1024 > 1) {
                            temp /= 1024;
                            i++;
                          }
                          let volume = "b";
                          switch (i) {
                            case 0: volume = "b";break;
                            case 1: volume = "Kb";break;
                            case 2: volume = "Mb";break;
                          }
                            return {
                              file: {
                                filename: (filename && filename.length > 0) ? filename : 'filename_was_not_processed',
                                data: partData,
                                date,
                                from,
                                size: (Math.round(temp * 100) / 100).toString().concat(volume),
                                icon: defineIcon(filename)
                              },
                              header: subject,
                            };
                        });
                }));
          });

        return Promise.all(attachments);
    }).then(function (attachments) {
      if (attachments.length === 0) {
        return;
      }
        const medRecAttachments = new Map();
        for (const attachment of attachments) {
          const newAtt = (medRecAttachments.has(attachment.header)) ? medRecAttachments.get(attachment.header) : [] ;
          newAtt.push(attachment.file);
          medRecAttachments.set(attachment.header, newAtt);
        }
        for (const [number, files] of medRecAttachments.entries()) {
            req.app.get("patientdb").collection('medrecs').findOne( {number: number.trim()}, (err, medrec) => {
              if (!err && medrec && medrec.isOpened) {
                req.app.get("patientdb").collection('mrelements').find( {mrId: new ObjectId(medrec._id), type: 3}).toArray((err, folders) => {
                  files.map(file => file.mrId = new ObjectId(medrec._id));
                  if (!err) {
                    if (folders && folders.length > 0) {
                      console.log('in folders');
                      async.each(folders, function(f, callback) {
                        req.app.get("db").collection('folders').findOne({_id: new ObjectId(f.initialId)}, (err, folder) => {
                          console.log(folder);
                          if (!err && folder) {
                            for (const file of files) {
                              if (!file.folderId) {
                                const fileType = mime.lookup(file.filename).toString();
                                if ((fileType.includes('application') || fileType.includes('text')) && folder.saveText) {
                                    if (folder.substrings && folder.substrings.length > 0) {
                                      if (folder.substrings.some(substr => substr === '' || file.filename.toLowerCase().includes(substr.toLowerCase()))) {
                                        console.log('Text', f._id, file.filename);
                                        file.folderId = new ObjectId(f._id);
                                      }
                                    } else {
                                      console.log('Text', f._id, file.filename);
                                      file.folderId = new ObjectId(f._id);
                                    }
                                } else if (fileType.includes('audio') && folder.saveAudios) {
                                    if (folder.substrings && folder.substrings.length > 0) {
                                      if (folder.substrings.some(substr => substr === '' || file.filename.toLowerCase().includes(substr.toLowerCase()))) {
                                        console.log('Audio', f._id, file.filename);
                                        file.folderId = new ObjectId(f._id);
                                      }
                                    } else {
                                      console.log('Audio', f._id, file.filename);
                                      file.folderId = new ObjectId(f._id);
                                    }
                                } else if (fileType.includes('video') && folder.saveVideos) {
                                    if (folder.substrings && folder.substrings.length > 0) {
                                      if (folder.substrings.some(substr => substr === '' || file.filename.toLowerCase().includes(substr.toLowerCase()))) {
                                        console.log('Video', f._id, file.filename);
                                        file.folderId = new ObjectId(f._id);
                                      }
                                    } else {
                                      console.log('Video', f._id, file.filename);
                                      file.folderId = new ObjectId(f._id);
                                    }
                                } else if (fileType.includes('image') && folder.saveImages) {
                                  console.log("in images", file.filename, folder._id);
                                    if (folder.substrings && folder.substrings.length > 0) {
                                      if (folder.substrings.some(substr => substr === '' || file.filename.toLowerCase().includes(substr.toLowerCase()))) {
                                        console.log('Image', folder._id, file.filename);
                                        file.folderId = new ObjectId(f._id);
                                      }
                                    } else {
                                      console.log('Image', f._id, file.filename);
                                      file.folderId = new ObjectId(f._id);
                                    }
                                }
                              }
                            }
                            callback();
                          } else {
                            callback(err);
                          }
                        });
                      }, function(err) {
                          if (err) {
                              return;
                          }
                          console.log("before insert", files);
                          req.app.get("patientdb").collection('documents').insertMany(files, (err) => {
                            if (err) {
                              console.log(err);
                            }
                          });
                        });

                      } else {
                        req.app.get("patientdb").collection('documents').insertMany(files, (err) => {
                          if (err) {
                            console.log(err);
                          }
                        });
                      }
                    } else {
                      req.app.get("patientdb").collection('documents').insertMany(files, (err) => {
                        if (err) {
                          console.log(err);
                        }
                      });
                    }
                });
              }
            });
        }

  });
});
}

function defineIcon(filename) {
  const fileType = mime.lookup(filename).toString();
  if (fileType.includes("video")) {
    return "far fa-file-video"
  }
  if (fileType.includes("audio")) {
    return "far fa-file-audio"
  }
  if (fileType.includes("image")) {
    return "far fa-file-image"
  }
  const ext = path.extname(filename);
  switch(ext) {
    case ".docx": return "far fa-file-word";
    case ".doc": return "far fa-file-word";
    case ".rtf": return "far fa-file-alt";
    case ".pdf": return "far fa-file-pdf";
    case ".txt": return "far fa-file-alt";
    case ".odt": return "far fa-file-alt";
    case ".pptx": return "far fa-file-powerpoint";
    case ".pps": return "far fa-file-powerpoint";
    case ".ppt": return "far fa-file-powerpoint";
    case ".zip": return "far fa-file-archive";
    case ".7z": return "far fa-file-archive";
    case ".bz": return "far fa-file-archive";
    default: return "far fa-file";
  }
}


module.exports = router;
