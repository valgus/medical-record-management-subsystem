const xl = require('excel4node');
const fs = require('fs');
const moment = require('moment');
module.exports = {

  /*
    params:
      @data - an object that has the following structure:
      {
        ovalues: {
          ovInfo: array with the information about obseved values, ovDetails: values of the observed values
        },
        questionnaires: {
          qInfo: array with the information about questionnaires, qDetails: values of the questionnaires
        }
      }

  */
  generateExcelForDepartment(data, callback) {
    console.log(JSON.stringify(data, null, 2));
      const xlsx = new xl.Workbook();
      const patientsRows = [];
      let patientNumber = 1;
      if (data.ovalues) {
        const ovWs = xlsx.addWorksheet('Observable Values');
        if (data.ovalues.ovInfo && data.ovalues.ovDetails) {
              const patientsDetails = [];

              for (const info of data.ovalues.ovInfo) {
                const mrId = info.mrId;
                let patient = patientsDetails.find(det => String(det.mrId) === String(mrId));
                if (!patient) {
                  patientsDetails.push({mrId, ovalues: []});
                  patient = patientsDetails[patientsDetails.length - 1];
                }
                const ov = {name: info.name, values: [], dates: []};
                for (const ovInfo of data.ovalues.ovDetails) {
                  if (String(ovInfo._id) === String(info._id)) {
                    const observings = ovInfo.observings;
                    for (const observing of observings) {
                      ov.dates.push(observing.date);
                      if (ovInfo.type === 2) {
                        ov.values.push({value: observing.value, isCritical: ovInfo.critical.some(cr =>  cr.min <=  observing.value && cr.max >= observing.value)});
                      } else {
                        ov.values.push({value: ovInfo.values[observing.value], isCritical: (ovInfo.type === 0) ? false : ovInfo.critical[observing.value]});
                      }
                    }
                  }
                }
                patient.ovalues.push(ov);
              }
              console.log("OVV: \n", JSON.stringify(patientsDetails, null, 2));
              let patientrow = 4; //+2
              const observedValuesColumns = [];
              for (const patientOValues of patientsDetails) {
                if (!patientsRows.find(patient => String(patient.id) === String(patientOValues.mrId))) {
                  patientsRows.push({id: patientOValues.mrId, row: patientrow, name: "patient ".concat(patientNumber)});
                  patientrow += 2;
                  patientNumber++;
                }
                for (const ovalue of patientOValues.ovalues) {
                  const obValue = observedValuesColumns.find(ov => ov.name === ovalue.name);
                  if (!obValue) {
                    observedValuesColumns.push({name: ovalue.name, length: ovalue.values.length + 1});
                  } else {
                    obValue.length = (obValue.length < (ovalue.values.length + 1)) ? ovalue.values.length + 1 : obValue.length;
                  }
                }

              }
              let cellStart = 1;
              for (const column of observedValuesColumns) {
                ovWs.cell(2, cellStart, 2, cellStart + column.length -1, true).string(column.name).style({alignment: {wrapText: true}, font: {bold: true, size: 14, color: 'blue' }, border: {bottom: {style: 'thick'}, right: {style: 'thick'}}});
                column.start = cellStart;
                cellStart += column.length;
              }
              for (const row of patientsRows) {
                const patientData = patientsDetails.find(patient => String(patient.mrId) === String(row.id));
                if (patientData) {
                  for (const obvalues of patientData.ovalues) {
                    const ovTitle = observedValuesColumns.find(column => column.name === obvalues.name);
                    if (ovTitle) {
                      let column = ovTitle.start;
                      ovWs.cell(row.row+1, column).string(row.name).style({ font: { bold: true, size: 12 } });
                      column++;
                      for (let i = 0; i < obvalues.values.length; i++) {
                          ovWs.cell(row.row, column).string(moment(obvalues.dates[i]).format('MMMM Do YYYY, HH:mm')).style({alignment: {wrapText: true}, border: {right: {style: 'medium'}, left: {style: 'medium'}, bottom: {style: 'medium'}, top: {style: 'medium'}}});
                          if (obvalues.values[i].isCritical) {
                          if (Number.isInteger(obvalues.values[i].value))
                            ovWs.cell(row.row+1, column).number(obvalues.values[i].value).style({alignment: {wrapText: true}, font: {color: "red"}, border: {right: {style: 'medium'}, left: {style: 'medium'}, bottom: {style: 'medium'}, top: {style: 'medium'}}});
                            else {
                              ovWs.cell(row.row+1, column).string(obvalues.values[i].value).style({alignment: {wrapText: true}, font: {color: "red"}, border: {right: {style: 'medium'}, left: {style: 'medium'}, bottom: {style: 'medium'}, top: {style: 'medium'}}});
                            }
                          }
                          else {
                            if (Number.isInteger(obvalues.values[i].value))
                              ovWs.cell(row.row+1, column).number(obvalues.values[i].value).style({alignment: {wrapText: true}, border: {right: {style: 'medium'}, left: {style: 'medium'}, bottom: {style: 'medium'}, top: {style: 'medium'}}});
                              else {
                                ovWs.cell(row.row+1, column).string(obvalues.values[i].value).style({alignment: {wrapText: true}, border: {right: {style: 'medium'}, left: {style: 'medium'}, bottom: {style: 'medium'}, top: {style: 'medium'}}});
                              }
                        }
                        column++;
                      }
                    }
                  }
                }
              }
            }
        }
          if (data.questionnaires && data.questionnaires.qInfo && data.questionnaires.qDetails) {
              const qWs = xlsx.addWorksheet('Questionnaires');
              const patientsDetails = [];

              for (const info of data.questionnaires.qInfo) {
                const mrId = info.mrId;
                let patient = patientsDetails.find(det => String(det.mrId) === String(mrId));
                if (!patient) {
                  patientsDetails.push({mrId, questionnaires: []});
                  patient = patientsDetails[patientsDetails.length - 1];
                }
                const questionnaire = {name: info.name, questions: [], answers: []};
                for (const qInfo of data.questionnaires.qDetails) {
                  if (String(qInfo._id) === String(info._id)) {
                    const questions = qInfo.questions;
                    for (const question of questions) {
                      questionnaire.questions.push(question.name);
                      const answer = qInfo.answers.find(answer => String(answer.qId) === String(question.id));
                      if (answer) {
                        if (question.type === 0 || question.type === 1) {
                          questionnaire.answers.push(answer.answer);
                        } else {
                          let value = '';
                          for (const option of answer.answer) {
                            value = value.concat(question.options[option]).concat(";");
                          }
                          questionnaire.answers.push(value);
                        }
                      }
                    }
                  }
                }
                patient.questionnaires.push(  questionnaire);
              }
              const columns = [];
              for (const patient of patientsDetails) {

              }
              let patientrow = 4;
              for (const patientQs of patientsDetails) {
                const patientInfo = patientsRows.find(patient => String(patient.id) === String(patientQs.mrId));
                if (!patientInfo) {
                  patientsRows.push({id: patientQs.mrId, row: patientrow, name: "patient ".concat(patientNumber)});
                  patientrow += 1;
                  patientNumber++;
                } else {
                  patientInfo.row = patientrow;
                  patientrow ++;
                }
                for (const questionnaire of patientQs.questionnaires) {
                  const qe = columns.find(q => q.name === questionnaire.name);
                  if (!qe) {
                    columns.push({name: questionnaire.name, questions: questionnaire.questions});
                  } else {
                    if (qe.questions !== questionnaire.questions) {
                      for (const question of questionnaire.questions) {
                        if (!qe.questions.indexOf(question) < 0) {
                          qe.questions.push(question);
                        }
                      }
                    }
                  }
                }

              }

              console.log("OVV: \n", JSON.stringify(patientsDetails, null, 2));

              let cellStart = 2;
              for (const column of columns) {
                qWs.cell(2, cellStart, 2, cellStart + column.questions.length-1, true).string(column.name).style({alignment: {wrapText: true}, font: {bold: true, size: 14, color: 'blue' }, border: {bottom: {style: 'thick'}, right: {style: 'thick'}}});
                column.start = cellStart;
                for (const index in column.questions) {
                  console.log(column.questions[index], column.questions[parseInt(index)] );
                  qWs.cell(3, cellStart+parseInt(index)).string(column.questions[parseInt(index)]).style({alignment: {wrapText: true}, border: {right: {style: 'medium'}, left: {style: 'medium'}, bottom: {style: 'medium'}, top: {style: 'medium'}}});
                }
                cellStart += column.questions.length;
              }
              for (const row of patientsRows) {
                const patientData = patientsDetails.find(patient => String(patient.mrId) === String(row.id));
                if (patientData) {
                  qWs.cell(row.row, 1).string(row.name).style({ font: { bold: true, size: 12 } });
                  for (const questionnaire of patientData.questionnaires) {
                    const qTitle = columns.find(column => column.name === questionnaire.name);
                    if (qTitle) {
                      let column = qTitle.start;
                      for (let i = 0; i < questionnaire.answers.length; i++) {
                        let index = qTitle.questions.indexOf(questionnaire.questions[i]);
                        if (index >= 0) {
                          if (Number.isInteger(questionnaire.answers[i])) {
                            qWs.cell(row.row, qTitle.start+index).number(questionnaire.answers[i]).style({alignment: {wrapText: true}, border: {right: {style: 'medium'}, left: {style: 'medium'}, bottom: {style: 'medium'}, top: {style: 'medium'}}});
                          } else {
                            qWs.cell(row.row, qTitle.start+index).string(questionnaire.answers[i]).style({alignment: {wrapText: true}, border: {right: {style: 'medium'}, left: {style: 'medium'}, bottom: {style: 'medium'}, top: {style: 'medium'}}});
                          }
                        }
                      }
                    }
                  }
                }
              }

      }
      xlsx.writeToBuffer().then(function (buffer) {
          callback ( null, buffer.toString('base64') );
      });

  },
}
