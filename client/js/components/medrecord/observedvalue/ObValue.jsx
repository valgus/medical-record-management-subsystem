

import React, { Component } from 'react'
import { connect } from 'react-redux'
import {browserHistory} from 'react-router'

import moment from 'moment'

import Message from '../../shared/Message.jsx'
import Loading from '../../Loading.jsx'

import Graph from './Graph.jsx'

import medrecService from '../../../services/medrec.js'


class ObValue extends Component {


    constructor(props) {
      super(props);
      this.state = {
        message: null,
        loading: false,
        isError: false,
        name: '',
        obValue: {},
        newValue: '',
        comment: '',
        newDate: 0,
        wrongInput: false
      }
      this.completeObValue = this.completeObValue.bind(this);
      this.setAppropriateInput = this.setAppropriateInput.bind(this);
      this.saveObValue = this.saveObValue.bind(this);
      this.changeComment = this.changeComment.bind(this);
      this.changeNewValue = this.changeNewValue.bind(this);
      this.changeMissedDate = this.changeMissedDate.bind(this);
      this.deleteObserving = this.deleteObserving.bind(this);
  }

  componentDidMount() {
  this.setState({message: null, loading: true, isError: false});
    medrecService.getObValue(this.props.params.id, (err, obValue) => {
      if(err){
        console.log(err);
        this.setState({
          loading: false, message: "The problem with observed value information occured.", isError: true
        });
        return;
      }
      const newValue = (obValue.type === 2) ? '' : 0;
      this.setState({loading: false, obValue, newValue});
    });
  }

  completeObValue() {
    this.setState({loading: true, message: null, isError: false});
    const data = {
      id: this.props.params.id,
      isComplete: !this.state.obValue.isComplete,
      isObservedValue: true
    }
    medrecService.completeElement(data,  (err, res) => {
      if(err){
        this.setState({
          loading: false, message: "The problem with observed value completing occured.", isError: true
        });
        return;
      }
      const obValue = { ...this.state.obValue};
      obValue.isComplete = !obValue.isComplete;
      this.setState({loading: false, obValue});
    });
  }

  saveObValue() {
      if (this.state.obValue.type === 2) {
        for (const range of this.state.obValue.values) {
          if (this.state.newValue < range.min || this.state.newValue > range.max) {
            this.setState({wrongInput: true});
            return;
          }
        }
        this.setState({wrongInput: false});
      }
      const data = {
          id: this.props.params.id,
          value: this.state.newValue,
          comment: this.state.comment,
          date: moment.utc(new Date(this.state.obValue.incompleteOvalues[this.state.newDate])).valueOf()
      }
      console.log(data);
      this.setState({message: null, loading: true, isError: false});
      medrecService.saveObValue(data, (err, result) => {
        if (err) {
          console.log(err);
          this.setState({
            loading: false, message: "The problem with observed value information saving occured.", isError: true
          });
          return;
        }
        const newValue = (result.type === 2) ? '' : 0;
        const obValue = {...this.state.obValue};
        obValue.incompleteOvalues = result.incompleteOvalues;
        obValue.observings = result.observings;
        this.setState({ obValue, loading: false, newValue, comment: '', newDate: 0});
      })
  }

  changeComment(e) {
    this.setState({ comment: e.target.value });
  }

  changeNewValue(e) {
    this.setState({ newValue: parseInt(e.target.value) });
  }

  changeMissedDate(e) {
    this.setState({ newDate: parseInt(e.target.value) });
  }

  deleteObserving(index) {
    const observingToDelete = this.state.obValue.observings[index];
    observingToDelete.id = this.props.params.id;
    medrecService.deleteObserving(observingToDelete, (err, result) => {
      if (err) {
        console.log(err);
        this.setState({
          loading: false, message: "The problem with observed value deletion occured.", isError: true
        });
        return;
      }
      const obValue = {...this.state.obValue};
      obValue.incompleteOvalues = result.incompleteOvalues;
      obValue.observings = result.observings;
      this.setState({ obValue, loading: false});
    })
  }

  setAppropriateInput() {
    if (this.state.obValue.type === 0 || this.state.obValue.type === 1) {
      return (
        <div className="select is-small">
        <select value={this.state.newValue}  onChange={this.changeNewValue}>
          {
          this.state.obValue.values.map((value, index) => {
            return (
              <option value={index} key={index}>{value}</option>
            );
          })
          }
        </select>
        </div>
      );
    } else {
      return(
        <div>
          <input className="input is-small" type="number" value={this.state.newValue}  onChange={this.changeNewValue} placeholder="Observed value"/>
          <p className="help is-info">Observed value should be in the following range:
            {  this.state.obValue.values.map((value, index) => {
              return ("[" + value.min + ', ' + value.max + "]; ");
            })}
          </p>
        </div>
      );
    }
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
                    <h5 className="title is-5 mr-10">Observed value: {this.state.obValue.name}. {(this.state.obValue.isComplete) ? "[closed]" : ''}</h5>
                  </div>
              </div>
              <div className="level-right">
                <a className="button level-item is-small is-primary" onClick={browserHistory.goBack}>Return</a>
              </div>
            </nav>
          <hr/>

          {this.state.obValue.incompleteOvalues && this.state.obValue.incompleteOvalues.length > 0  &&
            <div className="missed-observed-values">
              <p>Set missed value for the observed value.</p>

              <div className="select is-small">
                <select value={this.state.newDate}  onChange={this.changeMissedDate}>
                {
                  this.state.obValue.incompleteOvalues.map((date, index) => {
                    return (
                      <option value={index} key={index}>{moment(date).format('MMMM Do YYYY, HH:mm')}</option>
                    );
                  })
                }
                </select>
              </div>

              <div className="field is-horizontal mt-10">
      				  <div className="field-label is-small">
      					<label className="label">Value</label>
      				  </div>
      				  <div className="field-body">
      					<div className="field">
      					  <div className="control">
      						  {this.setAppropriateInput()}
      					  </div>
      					</div>
      				  </div>
      				</div>

      				<div className="field is-horizontal mt-10">
      				  <div className="field-label is-small">
      					<label className="label">Comment</label>
      				  </div>
      				  <div className="field-body">
      					<div className="field">
      					  <div className="control">
      						<textarea className="textarea is-small" placeholder="Set comment to the value if needed" value={this.state.comment} onChange={this.changeComment}></textarea>
      					  </div>
      					</div>
      				  </div>
      				</div>
              <div className="has-text-centered">
                <a className="button is-small is-info mt-20" onClick={this.saveObValue}>Save</a>
              </div>
            </div>
          }

            { this.state.obValue.observings && this.state.obValue.observings.length > 0 &&
              <div className="obvalue-values mt-40">
                <h3>Values</h3>
                  <table className="table medrec-elements mt-40">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Value</th>
                        <th>Comments</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.obValue.observings.map((el, index) => {
                          return (
                            <tr key={index}>
                              <th>{index+1}</th>
                              <td>
                                {moment(el.date).format('MMMM Do YYYY, HH:mm')}
                              </td>
                              <td>{(this.state.obValue.type === 2) ? el.value : this.state.obValue.values[el.value]}</td>
                              <td>{el.comment}</td>
                              <td><a onClick={() => this.deleteObserving(index)}><i className="fas fa-times"></i></a></td>
                            </tr>
                        )
                      })}
                    </tbody>
                  </table>
              </div>
            }

            { this.state.obValue.showGraph &&  this.state.obValue.observings && this.state.obValue.observings.length > 0 &&
              <div className="graph">
                  <Graph obValue={this.state.obValue}/>
              </div>
            }

            <div className="close-element has-text-centered mt-80">
              <a className="button is-small is-warning" onClick={this.completeObValue}>{(this.state.obValue.isComplete) ? "Open observed value" : "Complete observed value"}</a>
            </div>
        </div>
    );
  }
}

export default ObValue
