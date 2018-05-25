const express = require('express');

const async = require('async');
const ObjectId = require('mongodb').ObjectID;

const moment = require('moment');
const officegen = require('officegen');
const htmlDocx = require('html-docx-js');
var jsZip = require("jszip");
const mime = require('mime-types');

const fs = require('fs');
const path = require('path');

global.appRoot = path.resolve(__dirname);

const router = new express.Router();




    router.post('/download', (req, res, next) => {
      console.log('-------------------RETURN DOWNLOAD--------------------------------');
      const data = req.body;
      downloadFile(req, data, (err, result) => {
        if (err) {
          return res.status(500).json(err);
        }
        return res.status(200).json(result);
      })

    });

    router.post('/downloadAttach', (req, res, next) => {
      console.log('-------------------RETURN DOWNLOAD--------------------------------');
      const data = req.body;
      req.app.get("patientdb").collection('documents').findOne({_id: new ObjectId(data.id)}, (err, attach) => {
        if (err || !attach) {
            return res.status(500).json({error: 'Error during attachment retrieving.'});
        }
        let base64 = attach.data.toString('base64');
        console.log(base64);
        const fileType = mime.lookup(attach.filename).toString().replace("jpeg", "jpg");
        console.log(fileType);
        base64 = "data:" + fileType.concat(";base64, ").concat(base64);
        return res.status(200).json(base64);
      });

    });


    router.post('/downloadZip', (req, res, next) => {
      console.log('-------------------RETURN DOWNLOAD--------------------------------');
      const data = req.body;
      req.app.get("patientdb").collection('medrecs').findOne( {_id: new ObjectId(data.id)}, (err, medrec) => {
        if (err || !medrec) {
          return res.status(500).json({error: 'Error during medical record retrieving.'});
        }
        req.app.get("patientdb").collection('mrelements').find({mrId : new ObjectId(medrec._id)}).toArray((err, elements) => {
          if (err) {
            return res.status(500).json({error: 'Error during medical record files retrieving.'});
          }
          if (elements && elements.length > 0) {
            var zip = new jsZip();

            async.each(elements, function(element, callback) {
              if (element.type === 3) {
                return callback();
              }
              const data = {
                id: element._id,
                type: element.type
              }
              downloadFile(req, data, (err, result) => {
                if (err) {
                  console.log(err);
                  return callback(err);
                }
                console.log(element.name);
                console.log(result instanceof Array);
                console.log(result instanceof String);
                console.log(result);
                if (element.type === 0) {
                //  result =  "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64, " + result;
                  zip.file(element.name + ".xlsx", result, {base64 : true});
                } else {
                  zip.file(element.name + ".docx", result, {base64 : true});
                }


                return callback();
              })

            }, function(err) {
                console.log("all documents are processed");
                if (err) {
                  return res.status(500).json(err);
                }
                zip.generateAsync({type:"base64"}).then(function (base64) {
                  return res.status(200).json(base64);
                }, function (err) {
                  console.log(err);
                  return res.status(500).json({error: 'Error during zip creation occured.'});
                });
            });
          } else {
              return res.status(500).json({error: 'Medical record does not contain any files.'});
          }
        });
      });
    });


    function downloadFile(req, data, callback) {
      switch(data.type) {
        case 0:
          req.app.get("patientdb").collection('questionnaires').findOne( {_id: new ObjectId(data.id)}, (err, questionnaire) => { //find missed obserrved values
            if (err) {
              return callback({error: 'Error during questionnaire information retrieving.'});
            }
            req.app.get("patientdb").collection('mrelements').findOne( {_id: new ObjectId(data.id)}, (err, generalInfo) => {
              if (err) {
                return callback({error: 'Error during questionnaire information retrieving.'});
              }
              const xlsx = officegen ( 'xlsx' );
              xlsx.on ( 'error', function ( err ) {
                console.log ( err );
                return callback({error: 'Error during file creation.'});
              });
              sheet = xlsx.makeNewSheet();
              sheet.name = generalInfo.name;

              let row = 1;
              questionnaire.questions.map((question, index) => {
                let column = 1;
                sheet.data[row] = [];
                sheet.data[row][column] = question.name;
                column +=2;
                if (  question.type === 0 || question.type === 1) {
                  sheet.data[row][column] = questionnaire.answers[index].answer;
                } else {
                  for (const option of question.options) {
                    sheet.data[row][column] = option;
                    column++;
                  }
                  ++row;
                  sheet.data[row] = [];
                  column -= (question.options.length);
                  for (const answer of questionnaire.answers[index].answer) {
                     sheet.data[row][column+answer] = "+";
                  }
                }
                row += 2;
              });
              const filename = 'tmp/out' + data.id +'.xlsx'
              var out = fs.createWriteStream ( filename );

              out.on ( 'error', function ( err ) {
                console.log ( err );
                return callback({error: 'Error during file creation.'});
              });
              async.parallel ([
                function ( done ) {
                  out.on ( 'close', function () {
                    console.log ( 'Finish to create an Excel file with  questionnaire.' );
                    const bitmap = fs.readFileSync(filename);
                    // convert binary data to base64 encoded string
                    const base64 =  new Buffer(bitmap).toString('base64') + "";
                    done ( null, base64 );
                  });
                  xlsx.generate ( out );
                }

              ], function ( err, base64 ) {
                fs.unlink(filename)
                if ( err ) {
                  console.log ( 'error: ' + err );
                    return callback({error: 'Error during file saving.'});
                } else {
                  return callback(null, Array.from(base64)[0]);
                }
              });
            });
          });
          break;
        case 1:
          req.app.get("patientdb").collection('templates').findOne( {_id: new ObjectId(data.id)}, (err, template) => { //find missed obserrved values
            if (err) {
              return callback({error: 'Error during template information retrieveing.'});
            }
            req.app.get("patientdb").collection('mrelements').findOne( {_id: new ObjectId(data.id)}, (err, generalInfo) => {
              if (err) {
                return callback({error: 'Error during template information retrieveing.'});
              }
              generateDocument(template.parts, (info) => {
                console.log(info);
                  let details = {type: 0, mrId: new ObjectId(generalInfo.mrId)};
                  req.app.get('patientdb').collection('mrelements').find(details).toArray((err, questionnaires) => {
                    if (err || !questionnaires) {
                        return  callback({error: 'Error during answers of the document finding.'});
                    }
                    const qIds = [];
                    for (const q of questionnaires) {
                        qIds.push(new ObjectId(q._id));
                    }
                    if (qIds.length !== 0 && info.codes.length > 0) {
                      details = { _id : { $in: qIds } };
                      const answers = [];
                      req.app.get('patientdb').collection('questionnaires').find(details).toArray((err, questionnaires) => {
                        if (err || !questionnaires) {
                            return  callback({error: 'Error during answers of the document finding.'});
                        }
                        for (const qn of questionnaires) {
                          for (const i in qn.questions) {
                            const q = qn.questions[i];
                            if (info.questionIds.indexOf(q.id.toString()) > -1) {
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
                        console.log(answers);
                        for (const answer of answers) {
                          answer.code = answer.code.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                          info.docx = info.docx.replace(new RegExp(answer.code, 'g'), answer.value);
                        }
                      const filename = '\\tmp\\out' + data.id +'.html'
                      fs.writeFile(process.cwd() + filename, info.docx, function(err) {
                          if(err) {
                            console.log(err, 'during writing');
                              return  callback({error: 'Error during html creation.'});
                          }
                          fs.readFile(process.cwd() + filename, 'utf-8', function(err, html) {
                          fs.unlink(process.cwd() +filename)
                            if (err) {
                              console.log(err, 'during reading');
                                return  callback({error: 'Error during html reading.'});
                            }
                            const docx = htmlDocx.asBlob(html);
                            return  callback(null, docx.toString('base64'));
                          });
                      });
                    });
                  } else {
                    const filename = '\\tmp\\out' + data.id +'.html'
                    fs.writeFile(process.cwd() + filename, info.docx, function(err) {
                        if(err) {
                          console.log(err, 'during writing');
                            return  callback({error: 'Error during html creation.'});
                        }
                        fs.readFile(process.cwd() + filename, 'utf-8', function(err, html) {
                        fs.unlink(process.cwd() +filename)
                          if (err) {
                            console.log(err, 'during reading');
                              return  callback({error: 'Error during html reading.'});
                          }
                          const docx = htmlDocx.asBlob(html);
                          return  callback(null, docx.toString('base64'));
                        });
                    });
                  }
                });
              });
            });
          });
          break;
        case 2:
          req.app.get("patientdb").collection('observedvalues').findOne( {_id: new ObjectId(data.id)}, (err, ovalue) => { //find missed obserrved values
            if (err) {
              return callback({error: 'Error during observed value information retrieving.'});
            }
            req.app.get("patientdb").collection('mrelements').findOne( {_id: new ObjectId(data.id)}, (err, generalInfo) => {
              if (err) {
                return callback({error: 'Error during observed value information retrieving.'});
              }
              const docx = officegen ( {
                type: 'docx',
                orientation: 'portrait',
                pageMargins: { top: 1000, left: 1000, bottom: 1000, right: 1000 }
              } );
              docx.on ( 'error', function ( err ) {
                    console.log ( err );
                    return callback({error: 'Error during observed value information saving.'});
                  });
              const pObj = docx.createP ( { align: 'center' } );

              pObj.addText ( generalInfo.name, { bold: true, font_size: 16 } );

              const table = [
                [{
                  val: "No.",
                  opts: {
                    b:true,
                    sz: '28',
                    align: "center"
                  }
                },{
                  val: "Date",
                  opts: {
                    b:true,
                    sz: '28',
                    align: "center"
                  }
                },{
                  val: "Value",
                  opts: {
                    b:true,
                    sz: '28',
                    align: "center"
                  }
                },{
                  val: "Is crititcal",
                  opts: {
                    b:true,
                    sz: '28',
                    align: "center"
                  }
                },{
                  val: "Comments",
                  opts: {
                    b:true,
                    sz: '28',
                    align: "center"
                  }
                }],
              ]

              ovalue.observings.map((observing, index) => {
                const row = [];
                row.push(index+1);
                row.push(moment(observing.date).format('MMMM Do YYYY, HH:mm'));
                if (ovalue.type === 2 ) {
                  row.push(observing.value);
                  let isCritical = false;
                  for (const critical of ovalue.critical) {
                    if (observing.value >= parseInt(critical.min) && observing.value <= parseInt(critical.max)) {
                      isCritical = true;
                    }
                  }
                  row.push((isCritical) ? "Yes" : "No");
                } else {
                  row.push(ovalue.values[observing.value]);
                  row.push((ovalue.critical[observing.value]) ? "Yes" : "No") ;
                }
                row.push(observing.comment);
                table.push(row);
              });

              var tableStyle = {
                tableAlign: "center",
                tableFontFamily: "Times New Roman",
                tableColWidth: 4261,
                tableSize: 24,
                tableColor: "ada",
                borders: true
              }

              const pObj2 = docx.createTable (table, tableStyle);
              const filename = 'tmp/out' + data.id +'.docx'
              const out = fs.createWriteStream ( filename );

              out.on ( 'error', function ( err ) {
                console.log ( err );
                return callback({error: 'Error during observed value information saving.'});
              });

              async.parallel ([
                function ( done ) {
                  out.on ( 'close', function () {
                    console.log ( 'Finish to create a DOCX file with observed value.' );
                    const bitmap = fs.readFileSync(filename);
                    // convert binary data to base64 encoded string
                    const base64 =  new Buffer(bitmap).toString('base64') + "";
                    done ( null, base64 );
                  });
                  docx.generate ( out );
                }

              ], function ( err, base64 ) {
                fs.unlink(filename);
                if ( err ) {
                  console.log ( 'error: ' + err );
                    return callback({error: 'Error during observed value information retrieving.'});
                } else {
                  return callback(null, Array.from(base64)[0]);
                }
              });
            });
          });
          break;
      }
    }



    function convertToHtml(str) {
      str = str.replace(/class=/g, 'style=');
      str = str.replace(/ql-align-center/g, "text-align: center;" );
      str = str.replace(/ql-align-right/g, "text-align: right;" );
      str = str.replace(/ql-indent-1/g, "margin-left: 0.49in;" );
      str = str.replace(/ql-indent-2/g, "margin-left: 0.98in;" );
      str = str.replace(/ql-indent-3/g, "margin-left: 1.48in;" );
      str = str.replace(/ql-indent-4/g, "margin-left: 1.97in;" );
      str = str.replace(/ql-indent-5/g, "margin-left: 2.46in;" );
      str = str.replace(/ql-indent-6/g, "margin-left: 2.95in;" );
      str = str.replace(/ql-indent-7/g, "margin-left: 3.44in;" );
      str = str.replace(/ql-indent-8/g, "margin-left: 3.93in;" );
      str = str.replace(/ql-indent-9/g, "margin-left: 4.43in;" );
      str = str.replace(/ql-indent-10/g, "margin-left: 4.92in;" );
      str = str.replace(/ql-indent-11/g, "margin-left: 5.41in;" );
      str = str.replace(/ql-indent-12/g, "margin-left: 5.9in;" );
      str = str.replace(/ql-indent-13/g, "margin-left: 6.39in;" );
      str = str.replace(/ql-indent-14/g, "margin-left: 6.88in;" );
      str = str.replace(/ql-indent-15/g, "margin-left: 7.38in;" );
      str = str.replace(/ql-indent-15/g, "margin-left: 8.36in;" );
      str = str.replace(/ql-font-monospace/g, "font-family: monospace;");
      str = str.replace(/ql-font-serif/g, "font-family: serif;" );
      str = str.replace(/<ul/g, "<ul style='list-style-position: inside;'" );

      str = str.replace(/\" style=\"/g, ' '); //second occurance od style after previous replacements

      return str;
    }

    function generateDocument(parts, callback) {
      let str = '';
        for (const part of parts) {
          str += convertToHtml(part.delta);
        }
        let codes = str.match(/--\$\w+--/g);
        if (!codes) {
          codes = [];
        }
        const questionIds = [];
        for (const code of codes) {
          questionIds.push(code.substring(3, code.length-2));
        }
        const data = {
          questionIds,
          codes,
          docx: str
        };
        callback(data);
    }
module.exports = router;
