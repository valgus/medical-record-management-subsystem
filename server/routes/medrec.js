const express = require('express');
const passport = require('passport');

const enc = require('../services/encryption');
const async = require('async');
const ObjectId = require('mongodb').ObjectID;

const router = new express.Router();




router.get('/', (req, res, next) => {
  console.log('-------------------GET REQUEST MR PAGE--------------------------------');
  const depId = req.query.dId;
  const mrId = req.query.mrId;
  let details = {depId: depId,  type: { $not: { $eq: 3 } }};
  console.log(mrId);
  req.app.get("db").collection('mrelements').find(details).toArray((err, elements) => { //find all elements of medical records unlike folders
    if (err) {
      return  res.status(500).json({error: 'Error during medical record elements finding.'});
    }
    console.log('elements', elements);
    elements.sort(typeComparator);
    details = {  'mrId': new ObjectId(mrId)  };
    req.app.get("patientdb").collection('mrelements').find(details).toArray((err2, result) => {//find all elements created in the requested medical record
      if (err2) {
        return  res.status(500).json({error: 'Error during medical record elements finding.'});
      }
      req.app.get("patientdb").collection('medrecs').findOne( {_id: new ObjectId(mrId)}, (err, medrec) => { //find info about requested medical record
        if (err) {
          return  res.status(500).json({error: 'Error during medical record elements finding.'});
        }
        const incompleteOvalues = [];
        let completeElements = 0;
        async.each(result, function(element, callback) {
          if (element.type === 2) {
              if (element.isComplete) {
                completeElements++;
              }
              req.app.get("patientdb").collection('observedvalues').findOne( {_id: new ObjectId(element._id)}, (err, ovalue) => { //find missed obserrved values
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
                    if (ovalue.observings.filter(x => compareDates(x.date, missedOValues[index])).length > 0) {
                      alreadyInObValue.push(index);
                    }
                  }
                }
                if (missedOValues.length - alreadyInObValue.length > 0) {
                  incompleteOvalues.push({ id: element._id, times: missedOValues.length - alreadyInObValue.length });
                }
                callback();
              });
          } else {
            if (element.type !== 3 && element.isComplete) {
              completeElements++;
            }
            callback();
          }
        }, function(err) {
          if (err) {
              return  res.status(500).json({error: 'Error during medical record elements finding.'});
          }
          console.log(elements);
          console.log(completeElements);
          console.log(result);
          console.log('-----------------------------------------------------------------------');
          return res.status(200).json({
            general: medrec,
            elements: elements.filter(function (el) { //elements that were not created yet
                        return !result.some(function (f) {
                            return f.initialId.toString() === el._id.toString() });
                    }),
            createdElements: result,
            allElementsCompleted: completeElements === elements.length,
            completedElementNumber: completeElements,
            allElementsNumber: elements.length,
            incompleteOvalues });
        });
      });
    });
  });
});



router.post('/setStatus', (req, res, next) => {
  console.log('-------------------POST REQUEST SET MED REC STATUS--------------------------------');
  const data = req.body;
  const details = {_id : new ObjectId(data.id)};
  let updateInfo = {$set: {"isOpened" : data.status}}
  return req.app.get("patientdb").collection('medrecs').update(details, updateInfo, {upsert: true}, (err, result) => {
    if (err || !result) {
        return  res.status(500).json({error: 'Error during changing medical record status.'});
    }
      return res.status(200).json("ok");
  });
});


router.post('/add', (req, res, next) => {
  console.log('-------------------ADD NEW ELEMENT REQUEST MR PAGE--------------------------------');
    const newElement = req.body;
    console.log(newElement);
    req.app.get("db").collection('mrelements').findOne( {_id: new ObjectId(newElement.elementId)}, (err, element) => {
      if (err || !element) {
        return  res.status(500).json({error: 'Error during medical record elements adding.'});
      }
      const newmedrecElement = {
        initialId: element._id,
        name: element.name,
        type: element.type,
        mrId: new ObjectId(newElement.mrId),
        isComplete: false
      }
      req.app.get("patientdb").collection('mrelements').insert( newmedrecElement, (err, result) => {
        if (err) {
          return  res.status(500).json({error: 'Error during medical record elements adding.'});
        }
        addNewElement(req, element.type, newElement.elementId, result.ops[0]._id, (err) => {
          if (err) {
            console.log('in error adding new element');
            req.app.get("patientdb").collection('mrelements').remove({_id: new ObjectId(result.ops[0]._id) });
            return res.status(500).json({error: err});
          }
          req.app.get("patientdb").collection('mrelements').find({'mrId': new ObjectId(newElement.mrId)}).toArray((err2, mrelements) => {
            if (err) {
              return  res.status(500).json({error: 'Error during medical record elements extracting.'});
            }
            const incompleteOvalues = [];
            async.each(mrelements, function(element, callback) {
              if (element.type === 2) {
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
                        if (ovalue.observings.filter(x => compareDates(x.date, missedOValues[index])).length > 0) {
                          alreadyInObValue.push(index);
                        }
                      }
                    }
                    if (missedOValues.length - alreadyInObValue.length > 0) {
                      incompleteOvalues.push({ id: element._id, times: missedOValues.length - alreadyInObValue.length });
                    }
                    callback();
                  });
              } else if (element.type === 0) {
                callback();

              } else {
                callback();
              }
            }, function(err) {
              if (err) {
                  return  res.status(500).json({error: 'Error during medical record elements finding.'});
              }
              console.log('----------------------------------------------------------------');
              return res.status(200).json({mrelements, incompleteOvalues});
            });
          });
        });
      });
    });
});

router.get('/recentFiles', (req, res, next) => {
  const id = req.query.id;
  req.app.get("patientdb").collection('medrecs').find({depId: id}, {fields:{_id: 1, number: 1}}).toArray((err, medrecs) => {
    if (err) {
        return  res.status(500).json({error: 'Error during recent files finding.'});
    }
    console.log(medrecs);
    if (medrecs && medrecs.length > 0) {
      const ids = medrecs.map(medrec => medrec._id);
      console.log(ids);
      req.app.get("patientdb").collection('documents').find({mrId : { $in: ids }, date: {$gte: new Date().setDate(new Date().getDate() - 1)} }, {fields:{data: 0}})
      .toArray((err, documents) => {
        if (err) {
            return  res.status(500).json({error: 'Error during recent files finding.'});
        }
        for (const doc of documents) {
          doc.medrec = medrecs.find(medrec => medrec._id.toString() === doc.mrId.toString()).number;
        }
        return res.status(200).json(documents);
      })
    } else {
      return res.status(200).json([]);
    }
  });

});


router.get('/files', (req, res, next) => {
  const id = req.query.id;
  const mrId = req.query.mrId;
  let details ='';
  if (id === 'other-attachments') {
    details = {folderId: { "$exists" : false }, mrId: new ObjectId(mrId)};
  } else {
    details = {folderId: new ObjectId(id)};
  }
  console.log(details);
  req.app.get("patientdb").collection('documents').find(details, {fields:{data: 0}})
    .toArray((err, documents) => {
    if (err) {
      return  res.status(500).json({error: 'Error during files finding.'});
    }
    console.log(documents);
    return res.status(200).json(documents);
  });
});

router.get('/obValue', (req, res, next) => {

  console.log('-------------------GET REQUEST OBSERVED VALUE--------------------------------');
  const id = req.query.id;
  req.app.get("patientdb").collection('observedvalues').findOne({"_id": new ObjectId(id)}, (err, observedValue) => {
    if (err || !observedValue ) {
      return  res.status(500).json({error: 'Error during observed value finding.'});
    }
    req.app.get("patientdb").collection('mrelements').findOne({"_id": new ObjectId(id)}, (err, obValue) => {
      if (err || !obValue ) {
        return  res.status(500).json({error: 'Error during observed value finding.'});
      }
      observedValue.name = obValue.name;
      observedValue.isComplete = obValue.isComplete;
      const incompleteOvalues = [];
      let timetoset = observedValue.lastUpdate;
      const toDate = (observedValue.completeDate) ? observedValue.completeDate : Date.now();
      while (timetoset < toDate) {
        incompleteOvalues.push(timetoset);
        timetoset = timetoset + observedValue.frequency;
      }
      if (observedValue.observings && observedValue.observings.length > 0) {
        const alreadyInObValue = [];
        for (const index in incompleteOvalues) {
          if (observedValue.observings.filter(x => compareDates(x.date, incompleteOvalues[index])).length > 0) {
            alreadyInObValue.push(index);
          }
        }
        for (const index of alreadyInObValue.reverse()) {
          incompleteOvalues.splice(index, 1);
        }
      }
      observedValue.incompleteOvalues = incompleteOvalues;
      console.log('---------------------------------------------------------');
      return res.status(200).json(observedValue);
    });
  });
});


router.post('/obValue', (req, res, next) => {
    console.log('-------------------ADD NEW VALUE REQUEST OBSERVED VALUE--------------------------------');
    const newValue = req.body;
    console.log(newValue);
    const details = {  '_id':new ObjectId(newValue.id)  };
    req.app.get('patientdb').collection('observedvalues').findOne(details, (err, observedValue) => {
      if (err || !observedValue) {
          return  res.status(500).json({error: 'Error during observed value finding.'});
      }
      delete newValue.id;
      observedValue.observings.push(newValue);
      observedValue.observings.sort(function (a, b) {
        return a.date > b.date;
      });
      return req.app.get("patientdb").collection('observedvalues').update(details, observedValue, {upsert: true}, (err, result) => {
        if (err || !result) {
            console.log(err);
            return  res.status(500).json({error: 'Error during element creation.'});
        }
        const incompleteOvalues = [];
        let timetoset = observedValue.lastUpdate;
        const toDate = (observedValue.completeDate) ? observedValue.completeDate : Date.now();
        while (timetoset < toDate) {
          incompleteOvalues.push(timetoset);
          timetoset = timetoset + observedValue.frequency;
        }
        if (observedValue.observings && observedValue.observings.length > 0) {
          const alreadyInObValue = [];
          for (const index in incompleteOvalues) {
            if (observedValue.observings.filter(x => compareDates(x.date, incompleteOvalues[index])).length > 0) {
              alreadyInObValue.push(index);
            }
          }
          for (const index of alreadyInObValue.reverse()) {
            incompleteOvalues.splice(index, 1);
          }
        }
        observedValue.incompleteOvalues = incompleteOvalues;
        console.log('-------------------------------------------------------');
        return res.status(200).json(observedValue);
      });
    });
});


router.post('/deleteObValue', (req, res, next) => {

    console.log('-------------------DELETE REQUEST OBSERVED VALUE--------------------------------');
    const valueToDelete = req.body;
    const details = {  '_id':new ObjectId(valueToDelete.id)  };
    req.app.get('patientdb').collection('observedvalues').findOne(details, (err, observedValue) => {
      if (err || !observedValue) {
          return  res.status(500).json({error: 'Error during observed value finding.'});
      }
      delete valueToDelete.id;
      const indexToDelete = observedValue.observings.findIndex((el) => {
        return el.date === valueToDelete.date;
      })
      if (indexToDelete !== -1) {
        observedValue.observings.splice(indexToDelete, 1);
      }
      return req.app.get("patientdb").collection('observedvalues').update(details, observedValue, {upsert: true}, (err, result) => {
        if (err || !result) {
            console.log(err);
            return  res.status(500).json({error: 'Error during element deletion.'});
        }
        const incompleteOvalues = [];
        let timetoset = observedValue.lastUpdate;
        const toDate = (observedValue.completeDate) ? observedValue.completeDate : Date.now();
        while (timetoset < toDate) {
          incompleteOvalues.push(timetoset);
          timetoset = timetoset + observedValue.frequency;
        }
        if (observedValue.observings && observedValue.observings.length > 0) {
          const alreadyInObValue = [];
          for (const index in incompleteOvalues) {
            if (observedValue.observings.filter(x => compareDates(x.date, incompleteOvalues[index])).length > 0) {
              alreadyInObValue.push(index);
            }
          }
          for (const index of alreadyInObValue.reverse()) {
            incompleteOvalues.splice(index, 1);
          }
        }
        observedValue.incompleteOvalues = incompleteOvalues;
        console.log('----------------------------------------------------------');
        return res.status(200).json(observedValue);
      });
    });
});


router.get('/questionnaire', (req, res, next) => {
  console.log('-------------------GET REQUEST QUESTIONNAIRE--------------------------------');
  const id = req.query.id;
  req.app.get('patientdb').collection('mrelements').findOne({_id: new ObjectId(id)}, (err, element) => {
    if (err || !element) {
      return res.status(404).json('Questionnaire was not found in patient db.');
    }
      req.app.get('patientdb').collection('questionnaires').findOne({_id: new ObjectId(id)}, (err, q) => {
        if (err || !q) {
          return res.status(500).json({ error: "Questionnaire infi was not found."});
        }
        const result = {};
        result.name = element.name;
        result.isComplete = element.isComplete;
        result.questions = q.questions;
        if (q.answers) {
          result.answers = q.answers;
        }
        console.log('-------------------------------------------------------------');
        return res.status(200).json(result);
      });
  })
});


router.post('/completeElement', (req, res, next) => {
  console.log('-------------------GET REQUEST COMPLETE ELEMENT--------------------------------');
  const data = req.body;
  const details = {_id : new ObjectId(data.id)};
  let updateInfo = {$set: {"isComplete" : data.isComplete}}
  return req.app.get("patientdb").collection('mrelements').update(details, updateInfo, {upsert: true}, (err, result) => {
    if (err || !result) {
        return  res.status(500).json({error: 'Error during element completing.'});
    }
    console.log(data);
    if (data.isObservedValue) {
      if (data.isComplete) {
        updateInfo = {$set: { completeDate : Date.now() } };
      } else {
        updateInfo = {$set: { completeDate : null } };
      }
      req.app.get("patientdb").collection('observedvalues').update(details, updateInfo, {upsert: true}, (err, result2) => {
        if (err || !result2) {
          let updateInfo = {$set: {"isComplete" : !data.isComplete}}
          req.app.get("patientdb").collection('mrelements').update(details, updateInfo, {upsert: true});
          return  res.status(500).json({error: 'Error during element completing.'});
        }
        console.log('---------------------------------------------------------------');
        return res.status(200).json("ok");
      });
    } else {
      console.log('---------------------------------------------------------------');
      return res.status(200).json("ok");
    }
  });
});



router.post('/questionnaire', (req, res, next) => {
  console.log('-------------------SAVE REQUEST QUESTIONNAIRE--------------------------------');
  const data = req.body;
  console.log(data);
  const details = {  '_id':new ObjectId(data.id)  };
  req.app.get('patientdb').collection('questionnaires').findOne(details, (err, questionnaire) => {
    if (err || !questionnaire) {
        return  res.status(500).json({error: 'Error during questionnaire finding.'});
    }
    console.log(questionnaire);
    questionnaire.answers = data.answers;
    return req.app.get("patientdb").collection('questionnaires').update(details, questionnaire, {upsert: true}, (err, result) => {
      console.log('---------------------------------------------------------------');
      return res.status(200).json("ok");
    });
  });
});

router.get('/template', (req, res, next) => {
  console.log('-------------------GET REQUEST TEMPLATE--------------------------------');
  const id = req.query.id;
  req.app.get('patientdb').collection('mrelements').findOne({_id: new ObjectId(id)}, (err, element) => {
    if (err || !element) {
      return res.status(404).json({ error: 'Template was not found in patient db'});
    }
      req.app.get('patientdb').collection('templates').findOne({_id: new ObjectId(id)}, (err, t) => {
        if (err || !t) {
          return res.status(500).json({ error: "Template info was not found"});
        }
        const result = {};
        result.name = element.name;
        result.isComplete = element.isComplete;
        result.parts = t.parts;
        console.log(result);
        console.log('-------------------------------------------------------------');
        return res.status(200).json(result);
      });
  })
});

router.post('/template', (req, res, next) => {
  console.log('-------------------SAVE REQUEST TEMPLATE--------------------------------');
  const data = req.body;
  console.log(data);
  const details = {  '_id':new ObjectId(data.id)  };
  req.app.get('patientdb').collection('templates').findOne(details, (err, template) => {
    if (err || !template) {
        return  res.status(500).json({error: 'Error during template finding.'});
    }
    console.log(template);
    template.parts = data.parts;
    return req.app.get("patientdb").collection('templates').update(details, template, {upsert: true}, (err, result) => {
      console.log('---------------------------------------------------------------');
      return res.status(200).json(template);
    });
  });
});

router.post('/templateAnswers', (req, res, next) => {
  console.log('-------------------RETURN TEMPLATE ANSWERS--------------------------------');
  const data = req.body;
  console.log(data);
  let details = {  '_id':new ObjectId(data.id)  };
  req.app.get('patientdb').collection('mrelements').findOne(details, (err, template) => {
    if (err || !template) {
        return  res.status(500).json({error: 'Error during template finding.'});
    }
    details = {type: 0, mrId: new ObjectId(template.mrId)};
    req.app.get('patientdb').collection('mrelements').find(details).toArray((err, questionnaires) => {
      if (err || !questionnaires) {
          return  res.status(500).json({error: 'Error during answers of the document finding.'});
      }
      const qIds = [];
      for (const q of questionnaires) {
          qIds.push(new ObjectId(q._id));
      }
      console.log("questionnaire ids: ", qIds);
      if (qIds.length === 0) {
        console.log('---------------------------------------------------------------');
        return res.status(200).json([]);
      } else {
        details = { _id : { $in: qIds } };
        const answers = [];
        req.app.get('patientdb').collection('questionnaires').find(details).toArray((err, questionnaires) => {
          if (err || !questionnaires) {
              return  res.status(500).json({error: 'Error during answers of the document finding.'});
          }
          console.log('resulted questionnaires', questionnaires);
          for (const qn of questionnaires) {
            for (const i in qn.questions) {
              const q = qn.questions[i];
              console.log(q.id);
              console.log(data.questionIds);
              if (data.questionIds.indexOf(q.id.toString()) > -1) {
                console.log('yes');
                if (qn.questions[i].type <= 1)
                  answers.push({code: "--$" + q.id + "--", value: qn.answers[i].answer});
                else if (qn.questions[i].type === 2){
                  if (qn.answers[i].answer.length === 0)
                    answers.push({code: "--$" + q.id + "--", value: ""});
                  else
                    answers.push({code: "--$" + q.id + "--", value: qn.questions[i].options[qn.answers[i].answer[0]]});
                } else {
                  const values = [];
                  qn.answers[i].answer = qn.answers[i].answer.sort((a, b) => a - b);
                  for (const answer of qn.answers[i].answer) {
                    values.push(qn.questions[i].options[answer]);
                  }
                  answers.push({code: "--$" + q.id + "--", value: values});
                }
              }
            }
          }
          console.log('answers', answers);
          return res.status(200).json(answers);
        });
      }
    });
  });
});


function addNewElement(req, type, elementId, newElementId, callback) {
  if (type === 2) {
      req.app.get("db").collection('observedvalues').findOne( {_id: new ObjectId(elementId)}, (err, element) => {
        if (err || !element) {
          return callback('Observed value is empty.');
        }
        const newObservedValue = {
          _id: newElementId,
          frequency: element.frequency,
          type: element.type,
          values: element.values,
          critical: element.critical,
          showGraph: element.showGraph,
          lastUpdate: Date.now(),
          observings: []
        }
        req.app.get("patientdb").collection('observedvalues').insert( newObservedValue, (err, result) => {
          if (err || !result) {
            return callback('Error during observed value saving occured.');
          }
          return callback(null);
        });
    });
  } else {
    if (type === 0) {
      req.app.get("db").collection('questionnaires').findOne( {_id: new ObjectId(elementId)}, (err, element) => {
        if (err) {
          return callback('Error during questionnaire finding.');
        }
        if (!element || !element.questions) {
          return callback('Questionnaire is empty.');
        }
      const answers = [];
      for (const question of element.questions) {
          const answer = {};
          answer.qId = question.id;
          answer.answer = (question.type === 0 || question.type === 1) ? '' : [];
          answers.push(answer);
        }
        req.app.get("patientdb").collection('questionnaires').insert( {_id: newElementId, questions: element.questions, answers}, (err, result) => {
          if (err || !result) {
            return callback('Error during questionnaire saving.');
          }
          return callback(null);
        });
      });
    } else  if (type === 1){
      req.app.get("db").collection('templates').findOne( {_id: new ObjectId(elementId)}, (err, element) => {
        if (err) {
          return callback('Error during template finding.');
        }
        if (!element || !element.parts || element.parts.length === 0) {
          return callback('Template is empty.');
        }
        for (const part of element.parts) {
          delete part.html;
        }
        req.app.get("patientdb").collection('templates').insert( {_id: newElementId, parts: element.parts}, (err, result) => {
          if (err || !result) {
            return callback('Error during template saving.');
          }
          return callback(null);
        });
      });
    } else {
        return callback(null);
    }
  }
}


function typeComparator(a,b) {
  return parseInt(b.type) - parseInt(a.type);
}


function compareDates(first, second) {
  console.log(first, second, first === second);
  return new Date(first).getTime() === new Date(second).getTime();
}


module.exports = router;
