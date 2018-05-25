

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { browserHistory } from 'react-router'

import medrecService from '../../services/medrec.js'
import downloadService from '../../services/download.js'

import Message from '../shared/Message.jsx'

import Loading from '../Loading.jsx'

function mapStateToProps (state) {
  return {
    user: state.user,
    activeDepartment: state.departments.activeDepartment
  }
}

class MRPage extends Component {

    constructor(props) {
      super(props);
      this.state = {
        message: null,
        loading: true,
        isError: false,
        newElement: '',
        medrec: {
          general: {},
          elements: [],
          createdElements: []
        }
    }

    this.changeNewElement = this.changeNewElement.bind(this);
    this.addElement = this.addElement.bind(this);
    this.processInfo = this.processInfo.bind(this);
    this.openElement = this.openElement.bind(this);
    this.changeMedRecStatus = this.changeMedRecStatus.bind(this);
    this.download = this.download.bind(this);
  }

  componentDidMount() {
    medrecService.get(this.props.activeDepartment, this.props.params.id, (err, res) => {
      if(err || !res ||res.err){
        console.log(err, res);
        this.setState({
          loading: false, message: (err) ? err.toString() : res.err, isError: true
        });
        return;
      }
      console.log(res);
      this.setState({loading: false, medrec: res});
      if (res.elements && res.elements.length > 0) {
        this.setState({newElement: res.elements[0]._id});
      }
    });
  }

  addElement() {
    this.setState({loading: true, message: null, isError: false});
    medrecService.addElement(this.state.newElement, this.props.params.id,  (err, res) => {
      if(err || !res ||res.err){
        console.log(err, res);
        this.setState({
          loading: false, message: "Element was not added to the medical record. " + err, isError: true
        });
        return;
      }
      console.log(res);
      const medrec = {...this.state.medrec};
      medrec.createdElements = res.mrelements;
      medrec.elements = medrec.elements.filter(function (el) {
                  return !res.mrelements.some(function (f) {
                      return f.initialId.toString() === el._id.toString() });
              }),
      this.setState({loading: false, medrec, incompleteOvalues: res.incompleteOvalues});
      if (medrec.elements && medrec.elements.length > 0) {
        this.setState({newElement: medrec.elements[0]._id});
      }
    });
  }

  changeNewElement(e) {
    this.setState({newElement: e.target.value});
  }

  processInfo(id, type) {
    if (type === 2 && this.state.medrec.incompleteOvalues && this.state.medrec.incompleteOvalues.length > 0 ) {
      for (const obValue of this.state.medrec.incompleteOvalues) {
        if (id === obValue.id) {
          return (`Observed value was not processed ${obValue.times} times.`)
        }
      }
      return ("")
    }
  }

  openElement(id, type) {
    switch (type) {
      case 0:
        browserHistory.push(`/q/${id}`)
        break;
      case 2:
        browserHistory.push(`/ov/${id}`)
        break;
      case 3:
      browserHistory.push({
        pathname: `/f/${id}`,
        state: { mrId: this.props.params.id }
      });
        break;
      case 1:
        browserHistory.push(`/t/${id}`)
        break;
      default:

    }
  }

  download(e, index) {
    e.preventDefault();
    e.stopPropagation();
    const data = {
      id: this.state.medrec.createdElements[index]._id,
      type: this.state.medrec.createdElements[index].type
    }
    this.setState({loading: true, isError: false, message: null});
    downloadService.download(data, (err, base64) => {
      console.log(err, base64);
      if (err) {
        this.setState({loading: false, isError: true, message: "Error during file preparation occured."});
      }
      if (base64) {
          this.setState({loading: false});
          if (this.state.medrec.createdElements[index].type !== 0) {
            window.open("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64, " + base64);
          } else {
            window.open("data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64, " + base64);
          }
      } else {
        this.setState({loading: false, message: "File was not generated.", isError: true});
      }
    });
  }

  changeMedRecStatus(status) {
    const data = {
      id: this.props.params.id,
      status
    }
    this.setState({loading: true, isError: false, message: null})
    medrecService.setMedRecStatus(data, (err, res) => {
      if(err){
        this.setState({
          loading: false, message: err, isError: true
        });
        return;
      }
      const medrec = {...this.state.medrec};
      medrec.general.isOpened = status;
      this.setState({loading: false, medrec});
    });
  }

  render() {
    if (this.state.loading) {
      return (<Loading/>)
    }
    let number = 0;
    return (
      <div className="content-wrapper">
        { this.state.message && <Message message={this.state.message} isError={this.state.isError} />}
        <div className="box">
          <div style={{display: "inline-flex"}}>
            <h2 className="title is-4">Medical record: {this.state.medrec.general.number}</h2>
            <i className={(this.state.medrec.general.isOpened) ?  "fas fa-circle green" :  "fas fa-circle red"}></i>
          </div>
          {this.state.medrec.general.info && <h2 className="title is-6">Information: {this.state.medrec.general.info}</h2>}
          <p className="mt-40">created at: {this.state.medrec.general.date}</p>
          <progress className="progress is-primary" value={this.state.medrec.completedElementNumber} max={this.state.medrec.allElementsNumber }></progress>
        </div>
        {
          this.state.medrec.allElementsCompleted && this.state.medrec.general.isOpened &&
          <article className="message is-primary">
            <div className="message-body">
              <p>All elements are completed. Close medical record?</p>
              <a className="button is-link" onClick={() => this.changeMedRecStatus(false)}>Yes</a>
            </div>
          </article>

        }
        {
          !this.state.medrec.general.isOpened &&
          <article className="message is-warning">
            <div className="message-body">
              <p>Medical record is closed. Open medical record?</p>
              <a className="button is-link" onClick={() => this.changeMedRecStatus(true)}>Yes</a>
            </div>
          </article>
        }

        { this.state.medrec.general.isOpened && this.state.medrec.elements && this.state.medrec.elements.length > 0 &&
          <div className="field is-grouped mt-20">
            <div className="control is-expanded">
              <div className="select is-fullwidth is-small">
                 <select name="medrecElements"  value={this.state.newElement}  onChange={this.changeNewElement}>
                    {this.state.medrec.elements.map((el, index) => {
                      return (
                        <option key={index} value={el._id}>{el.name}</option>
                      )
                    })}
                 </select>
               </div>
            </div>
            <p className="control">
              <a className="button is-info is-small" onClick={this.addElement}>
                Add element
              </a>
            </p>
          </div>
        }

        <div className="folder-container mt-40">
          {this.state.medrec.createdElements.map((el, index) => {
            if (el.type === 3)
            return(
              <div className="box med-card has-text-centered" key={index} onClick={() => this.openElement(el._id, 3)}>
                <span className="icon is-small med-icon"><i className="far fa-folder-open"></i></span>
                <p className="med-text">{ el.name }</p>
              </div>
            )
          }) }
          <div className="box med-card has-text-centered" key={-1} onClick={() => this.openElement('other-attachments', 3)}>
            <span className="icon is-small med-icon"><i className="far fa-folder-open"></i></span>
            <p className="med-text">Other documents</p>
          </div>
        </div>

        <table className="table medrec-elements mt-40">
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Element</th>
              <th>Complete</th>
              <th>Information</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {this.state.medrec.createdElements.map((el, index) => {
              if (el.type !== 3) {
                number++;
                console.log(el.isComplete);
                return (
                  <tr key={index} onClick={() => this.openElement(el._id, el.type)}>
                    <th>{number}</th>
                    <td>
                      {parseInt(el.type) === 0 && <span className="icon is-small med-icon"><i className="far fa-question-circle"></i></span>}
                      {parseInt(el.type) === 1 && <span className="icon is-small med-icon"><i className="far fa-file-word"></i></span>}
                      {parseInt(el.type) === 2 && <span className="icon is-small med-icon"><i className="fas fa-heartbeat"></i></span>}
                    </td>
                    <td>{el.name}</td>
                    <td>{(el.isComplete) ? <i className="fas fa-check"></i> : ''}</td>
                    <td>{this.processInfo(el._id, el.type)}</td>
                    <td>{(el.isComplete) ? <a className="button is-info" onClick={(e) => this.download(e, index)}><i className="fas fa-download"></i></a> : ''}</td>
                  </tr>
              )
            }
            })}
          </tbody>
        </table>


      </div>
    );
  }
}

export default connect(mapStateToProps)(MRPage)
