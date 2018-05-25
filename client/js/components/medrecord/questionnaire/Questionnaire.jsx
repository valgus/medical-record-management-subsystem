

import React, { Component } from 'react'
import { connect } from 'react-redux'
import {browserHistory} from 'react-router'
import async from 'async'

import Message from '../../shared/Message.jsx'
import Loading from '../../Loading.jsx'

import medrecService from '../../../services/medrec.js'

class Questionnaire extends Component {


    constructor(props) {
      super(props);
      this.state = {
        message: null,
        loading: false,
        isError: false
      }
      this.changeOptionAnswer = this.changeOptionAnswer.bind(this);
      this.changeOpenAnswer = this.changeOpenAnswer.bind(this);
      this.completeQuestionnaire = this.completeQuestionnaire.bind(this);
      this.save = this.save.bind(this);
  }

  componentDidMount() {
    medrecService.getQuestionnaire(this.props.params.id, (err, questionnaire) => {
      console.log(questionnaire);
        if(err){
          console.log(err);
          this.setState({
            loading: false, message: "The problem with questionnaire extracting occured.", isError: true
          });
          return;
        }
        const answers = (questionnaire.answers) ? questionnaire.answers : [];
        const hiddenQuestions = [];
        for (const index in questionnaire.questions) {
          const question  = questionnaire.questions[index];
          if (!questionnaire.answers) { //if no answers yet
            const answer = {};
            answer.qId = question.id;
            answer.answer = (question.type === 0 || question.type === 1) ? '' : [];
            answers.push(answer);
          }
          if (question.hidden && question.linkIndex && questionnaire.answers) { //this if checks that if answers already exist and hidden questions should be seen
            const headQuesionIndex = questionnaire.questions.findIndex((el) => { return el.id === question.linkIndex });
            if (headQuesionIndex !== -1 && question.linkIndex === questionnaire.answers[headQuesionIndex].qId) {
              let containAll =  (question.linkAnswer.length === questionnaire.answers[headQuesionIndex].answer.length)
              if (containAll)
                for (let i = 0, l=question.linkAnswer.length; i < l; i++) {
                  if (questionnaire.answers[headQuesionIndex].answer.indexOf(question.linkAnswer[i]) < 0) {
                    containAll = false;
                  }
                }
              hiddenQuestions.push(!containAll);
            } else {
              hiddenQuestions.push(true);
            }
          } else {
            hiddenQuestions.push(question.hidden);
          }

        }
        this.setState({loading: false, questionnaire, answers, hiddenQuestions});

      });
  }

  changeOptionAnswer(qId, optionId, type) {
    let answers = this.state.answers.slice();
    let hiddenQuestions = this.state.hiddenQuestions.slice();
    let tempAnswer = {};
    for (const answer of answers) {
      if (answer.qId === qId) {
        if (type === 'radio') {
          answer.answer = [];
          answer.answer.push(optionId);
          tempAnswer = answer;
        }
        if (type === 'checkbox') {
          if (answer.answer.includes(optionId)) {
            answer.answer.splice(answer.answer.indexOf(optionId), 1);
          } else {
            answer.answer.push(optionId);
          }
          tempAnswer = answer;
        }
      }
    }
    let loop = true;
    let indexToObserve = [];
    const _this = this;
    indexToObserve.push(qId);
    async.whilst(
        function() { return loop },
        function(callback) {
          processAnswers(_this.state.questionnaire, answers, hiddenQuestions, indexToObserve.pop(), tempAnswer, (result) => {
            answers = result.answers;
            hiddenQuestions = result.hiddenQuestions;
            if (result.indexToObserve.length === 0 && indexToObserve.length === 0) {
              loop = false;
            } else {
              indexToObserve = indexToObserve.concat(result.indexToObserve);
              tempAnswer = answers.find(answer => answer.qId === indexToObserve[indexToObserve.length - 1]);
            }
            callback(null, loop);
          })
        },
        function (err, n) {
          _this.setState({hiddenQuestions, answers});
        }
    );
  }

  changeOpenAnswer(e, qId) {
    const answers = this.state.answers.slice();
    for (const answer of answers) {
      if (answer.qId === qId) {
        answer.answer = e.target.value;
      }
    }
    this.setState({answers});
  }

  save() {
    this.setState({loading: true, message: null, isError: false});
    const data = {
      answers : this.state.answers,
      id : this.props.params.id
    }
    medrecService.saveQuestionnaire(data,  (err, res) => {
        if(err){
          this.setState({
            loading: false, message: "The problem with questionnaire saving occured.", isError: true
          });
          return;
        }
        this.setState({loading: false, message: "Questionnaire was saved."});
      });
  }

  completeQuestionnaire() {
    this.setState({loading: true, message: null, isError: false});
    const data = {
      id: this.props.params.id,
      isComplete: !this.state.questionnaire.isComplete,
      isObservedValue: false
    }
    medrecService.completeElement(data,  (err, res) => {
      if(err){
        this.setState({
          loading: false, message: "The problem with questionnaire completing occured.", isError: true
        });
        return;
      }
      const questionnaire = { ...this.state.questionnaire};
      questionnaire.isComplete = !questionnaire.isComplete;
      this.setState({loading: false, questionnaire});
    });
  }

  render() {
    if (this.state.loading || !this.state.questionnaire) {
      return (<Loading/>)
    }
    const questionnaire = this.state.questionnaire;
    return (
      <div className="content-wrapper">
            { this.state.message && <Message message={this.state.message} isError={this.state.isError} />}

            <nav className="level">
              <div className="level-left">
                    <div className="level-item">
                      <h5 className="title is-5 mr-10">Questionnaire: {questionnaire.name}. {(this.state.questionnaire.isComplete) ? "[closed]" : ''}</h5>
                    </div>
              </div>
              <div className="level-right">
                <a className="button level-item is-small is-primary" onClick={browserHistory.goBack}>Return</a>
                <a className="button level-item is-small is-info" disabled={this.state.questionnaire.isComplete} onClick={this.save}>Save</a>
              </div>
            </nav>
          <hr/>
          <div className={"questionnaire-content " + ((this.state.questionnaire.isComplete) ? "disablecontent": "")}>
            {
              questionnaire.questions.map((question, index) => {
                if (!this.state.hiddenQuestions[index]) {
                return (
                    <div className="question-container mt-20" key={index}>
                        <hr/>
                        <div className="question-name">
                          <p><strong>{question.name}</strong></p>
                        </div>
                        <div className="question-options mt-5">
                            {
                              (question.type === 0) &&
                              <input  className="input is-small" value={this.state.answers[index].answer} type="text" onChange={(e) => this.changeOpenAnswer(e, question.id)}/>
                            }
                            {
                              (question.type === 1) &&
                              <input  className="input is-small" value={this.state.answers[index].answer} type="number" onChange={(e) => this.changeOpenAnswer(e, question.id)}/>
                            }
                            {
                              (question.type === 2) &&
                              (<div className="field">
                                <p className="control">
                              {question.options.map((option, j) => {
                                return (
                                  <label className="radio" key={j}>
                                    <input className="is-small" type="radio"  name={'option ' + index} checked={(this.state.answers && this.state.answers[index].answer.includes(j))} onChange={() => this.changeOptionAnswer(question.id, j, 'radio')}/>
                                    {option}
                                  </label>
                                )
                              })}
                            </p></div>)
                            }
                            {
                              (question.type === 3) &&
                              (<p className="control">
                              {question.options.map((option, j) => {
                                return (
                                  <label className="checkbox is-small" key={j}>
                                    <input type="checkbox" className="is-small" checked={(this.state.answers && this.state.answers[index].answer.includes(j))} onChange={() => this.changeOptionAnswer(question.id, j, 'checkbox')}/>
                                    {option}
                                  </label>
                                )
                              })}
                            </p>)
                            }
                        </div>
                    </div>
                );
              }
              })
            }
          </div>
          <div className="close-element has-text-centered mt-80">
            <a className="button is-small is-warning" onClick={this.completeQuestionnaire}>{(this.state.questionnaire.isComplete) ? "Open questionnaire" : "Complete questionnaire"}</a>
          </div>
      </div>
    );
  }
}

function processAnswers(questionnaire, answers, hiddenQuestions, qId, tempAnswer, callback) {

  const linkedQuestions = questionnaire.questions.filter(q => q.linkIndex === qId);
  const indexToObserve = [];
  console.log('linkedQuestion', linkedQuestions);
  for (const linkedQuestion of linkedQuestions) {
    if (linkedQuestion.linkAnswer) {
      let containAll = true;
      containAll =  (linkedQuestion.linkAnswer.length === tempAnswer.answer.length)
      if (containAll)
        for (let i = 0, l=linkedQuestion.linkAnswer.length; i < l; i++) {
          if (tempAnswer.answer.indexOf(linkedQuestion.linkAnswer[i]) < 0) {
            containAll = false;
          }
        }
      const index = questionnaire.questions.indexOf(linkedQuestion);
      hiddenQuestions[index] = !containAll;
      if (!containAll) {
        if (questionnaire.questions[index].type === 2 || questionnaire.questions[index].type === 3)
          indexToObserve.push(questionnaire.questions[index].id);
        for (const answer of answers) {
          if (answer.qId === questionnaire.questions[index].id) {
            answer.answer = (questionnaire.questions[index].type === 0 ||
            questionnaire.questions[index].type === 1) ? '' : [];
          }
        }
      }
    }
  }
  callback({answers, hiddenQuestions, indexToObserve});
}

export default Questionnaire
