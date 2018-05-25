

import React, { Component } from 'react'
import { connect } from 'react-redux'
import {browserHistory} from 'react-router'

import moment from 'moment'

import Message from '../../shared/Message.jsx'
import Loading from '../../Loading.jsx'


import TemplateEditor from './Editor.jsx'

import medrecService from '../../../services/medrec.js'

class Template extends Component {


    constructor(props) {
      super(props);
      this.state = {
        message: null,
        loading: false,
        isError: false,
        name: '',
        template: {},
        shownNotes: []
      }

      this.completeTemplate = this.completeTemplate.bind(this);
      this.showNotes = this.showNotes.bind(this);
      this.changePart = this.changePart.bind(this);
      this.save = this.save.bind(this);
      this.generateDocument = this.generateDocument.bind(this);
      this.closeGeneratedDocument = this.closeGeneratedDocument.bind(this);

  }

  componentDidMount() {
    this.setState({message: null, loading: true, isError: false});
      medrecService.getTemplate(this.props.params.id, (err, template) => {
        if(err){
          console.log(err);
          this.setState({
            loading: false, message: "The problem with template information occured.", isError: true
          });
          return;
        }
        const shownNotes = [];
        for (const part of template.parts) {
          shownNotes.push(false);
        }
        if (template.isComplete) {
          generateDocument(template.parts, this.props.params.id, medrecService, (err, str) => {
            if (err) {
              this.setState({
                loading: false, message: "The problem with template showing occured.", isError: true
              });
            } else {
              template.generatedDocument = str;
              this.setState({loading: false, template, shownNotes});
            }
          });
        } else {
            this.setState({loading: false, template, shownNotes});
        }
      });
  }

  save() {
    this.setState({message: null, loading: true, isError: false});
    const data = {
        id: this.props.params.id,
        parts : this.state.template.parts
    };
    medrecService.saveTemplate(data, (err, template) => {
        if(err){
          console.log(err);
          this.setState({
            loading: false, message: "The problem with template information occured.", isError: true
          });
          return;
        }
        this.setState({loading: false, template, message: "The template was saved."});
      });
  }

  completeTemplate() {
    this.setState({loading: true, message: null, isError: false});
    const data = {
      id: this.props.params.id,
      isComplete: !this.state.template.isComplete,
      isObservedValue: false,
    };
    const template = { ...this.state.template};
    if (!this.state.template.isComplete) {
      generateDocument(this.state.template.parts, this.props.params.id, medrecService, (err, str) => {
        if (err) {
          return this.setState({
            loading: false, message: "The problem with template showing occured.", isError: true
          });
        } else {
          template.generatedDocument = str;
          medrecService.completeElement(data,  (err, res) => {
            if(err){
              this.setState({
                loading: false, message: "The problem with template completing occured.", isError: true
              });
              return;
            }
            template.isComplete = !template.isComplete;
            this.setState({loading: false, template});
          });
        }
      });
    } else {
      medrecService.completeElement(data,  (err, res) => {
        if(err){
          this.setState({
            loading: false, message: "The problem with template completing occured.", isError: true
          });
          return;
        }
        template.isComplete = !template.isComplete;
        this.setState({loading: false, template});
      });
    }
  }

  changePart(index, value) {
      const template = {...this.state.template};
      template.parts[index].delta = value;
      this.setState({template});
  }

  showNotes(e, show, index) {
    e.preventDefault();
    const shownNotes = this.state.shownNotes.slice();
    shownNotes[index] = show;
    this.setState({shownNotes, notesIndex: index, showNotesInfo: show});
  }

  generateDocument() {
    this.setState({loading: true, message: null, isError: false});
    generateDocument(this.state.template.parts, this.props.params.id, medrecService, (err, str) => {
      if (err) {
        this.setState({
          loading: false, message: "The problem with document generation occured.", isError: true
        });
      } else {
          this.setState({loading: false, generatedDocument: str, showGeneratedDocument: true});
      }
    });
  }

  closeGeneratedDocument() {
    this.setState({generatedDocument: '', showGeneratedDocument: false});
  }

  render() {
    if (this.state.loading) {
      return (<Loading/>);
    }
    return (
      <div className="content-wrapper">
            { this.state.message && <Message message={this.state.message} isError={this.state.isError} />}

            <nav className="level">
              <div className="level-left">
                  <div className="level-item">
                    <h5 className="title is-5 mr-10">Template: {this.state.template.name}. {(this.state.template.isComplete) ? "[closed]" : ''}</h5>
                  </div>
              </div>
              <div className="level-right">
                <a className="button level-item is-small is-primary" onClick={browserHistory.goBack}>Return</a>
                <a className="button level-item is-small is-info" disabled={this.state.template.isComplete} onClick={this.save}>Save</a>
              </div>
            </nav>
          <hr/>
          { !this.state.template.isComplete &&
            <div>
              <nav className="level">
                <div className="level-left"></div>
                <div className="level-right">
                  <a className="button level-item is-small is-info" onClick={this.generateDocument}>See resulted document</a>
                </div>
              </nav>
              <div className="quill-container">
                {
                  this.state.template.parts && this.state.template.parts.map((part, index) => {
                    return (
                      <div className="columns" key={index}>
                        <div className="column is-11">
                          <TemplateEditor part={part} index={index} changePart={this.changePart}/>
                        </div>
                        {(part.notes) ?
                        <div className="column is-1" onClick={(e) => this.showNotes(e, true, index)}>
                           <i className="fas fa-info-circle"></i>
                        </div>
                        : ''}
                      </div>
                    )
                  })
                }
              </div>

              {this.state.showNotesInfo && <div className="modal is-active">
                <div className="modal-background"></div>
                  <div className="modal-card" style={{width: "70%"}}>
                    <section className="modal-card-body">
                      <p style={{whiteSpace: "pre-line"}}>{this.state.template.parts[this.state.notesIndex].notes}</p>
                    </section>
                  </div>
                <button className="modal-close is-large" aria-label="close" onClick={(e) => this.showNotes(e, false, this.state.notesIndex)}></button>
              </div> }

              {this.state.showGeneratedDocument && <div className="modal is-active">
                <div className="modal-background"></div>
                  <div className="modal-card" style={{width: "100%"}}>
                    <section className="modal-card-body template-view">
                      <div dangerouslySetInnerHTML={{ __html: this.state.generatedDocument }}/>
                    </section>
                  </div>
                <button className="modal-close is-large" aria-label="close" onClick={this.closeGeneratedDocument}></button>
              </div> }
          </div>
          }
          {
            this.state.template.isComplete && <div dangerouslySetInnerHTML={{ __html: this.state.template.generatedDocument }}/>
          }
          <div className="close-element has-text-centered mt-80">
            <a className="button is-small is-warning" onClick={this.completeTemplate}>{(this.state.template.isComplete) ? "Open template" : "Complete template"}</a>
          </div>
        </div>
    );
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

function generateDocument(parts, id, medrecService, callback) {
  let str = '';
    for (const part of parts) {
      str += convertToHtml(part.delta);
    }
    console.log(str);
    const codes = str.match(/--\$\w+--/g);
    console.log(codes);
    if (codes) {
      const questionIds = [];
      for (const code of codes) {
        questionIds.push(code.substring(3, code.length-2));
      }
      console.log(questionIds);
      const data = {
        questionIds,
        codes,
        id
      };
      medrecService.getAnswers(data, (err, answers) => {
          if(err){
            console.log(err);
            return callback(err);
          }
          for (const answer of answers) {
            answer.code = answer.code.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            str = str.replace(new RegExp(answer.code, 'g'), answer.value);
          }
          return callback(null, str);
      });
    } else {
      return callback(null, str);
    }
}

export default Template
