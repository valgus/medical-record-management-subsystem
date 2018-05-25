

import React, { Component } from 'react'
import { connect } from 'react-redux'
import {browserHistory} from 'react-router'

import depService from '../../services/department'
import downloadService from '../../services/download.js'

import DepartmentStatistics from './DepartmentStatistics.jsx'

import Loading from '../Loading.jsx'

function mapStateToProps(state) {
  return {
      user: state.user,
      activeDepartment: state.departments.activeDepartment
  }
}

class DepartmentPage extends Component {


    constructor(props) {
      super(props);
      this.state = {
        message: null,
        isError: false,
        loading: true,
        showMedrecForm: false,
        newMedrecNumber: '',
        additionalInfo: '',
        department: {
          name: '',
          medrecs: []
        }
      };
      this.showMedrecForm = this.showMedrecForm.bind(this);
      this.changeNewMedrecNumber = this.changeNewMedrecNumber.bind(this);
      this.changeAdditionalInfo = this.changeAdditionalInfo.bind(this);
      this.saveMedRec = this.saveMedRec.bind(this);
      this.openPatient = this.openPatient.bind(this);
      this.openDataPage = this.openDataPage.bind(this);
      this.download = this.download.bind(this);
    }


    componentDidMount() {
      console.log("in component department", this.props.activeDepartment);
      depService.get(this.props.activeDepartment, (err, department) => {
          if (err || !department) {
            return this.setState({isError: true, message: "Error occured. Try later.", loading: false});
          }
          if (department) {
            this.setState({department, loading: false});
          }
      })
    }

    componentWillReceiveProps(nextProps) {
      this.setState({loading: true, message: null, isError: false});
      depService.get(nextProps.params.id, (err, department) => {
          if (err || !department) {
            return this.setState({isError: true, message: "Error occured. Try later."});
          }
          if (department) {
            this.setState({department, loading: false});
          }
      })
    }

    showMedrecForm(show) {
      this.setState({showMedrecForm: show});
    }

    changeNewMedrecNumber(e) {
      this.setState({newMedrecNumber: e.target.value});
    }


    changeAdditionalInfo(e) {
      this.setState({additionalInfo: e.target.value});
    }

    saveMedRec() {
      const medrec = {
        depId: this.props.activeDepartment,
        number: this.state.newMedrecNumber,
        info: this.state.additionalInfo,
        date: new Date().toISOString().slice(0,10),
        isOpened: true
      }
      this.setState({isError: false, message: ''})
      depService.save(medrec, (err, medrecs) => {
        if(err) {
            return this.setState({isError: true, message: "Error occured. Try later."});
        }
        const department = {...this.state.department};
        department.medrecs = medrecs;
        this.setState({department, additionalInfo: '', newMedrecNumber: '', message: 'Medical record was saved.', showMedrecForm: false});
      });
    }

    openPatient(id) {
        browserHistory.push('/medrec/'+id);
    }

    download(e, index) {
      e.preventDefault();
      e.stopPropagation();
      console.log("downloading ", this.state.department.medrecs[index]);
      const data = {
        id: this.state.department.medrecs[index]._id
      }
      downloadService.downloadZip(data, (err, base64) => {
        console.log(err, base64);
        if (err) {
          this.setState({loading: false, isError: true, message: "Error during file preparation occured."});
        }
        if (base64) {
            this.setState({loading: false});
            window.open("data:application/zip;base64, " + base64);
        } else {
          this.setState({loading: false, message: "File was not generated.", isError: true});
        }
      });
    }

    openDataPage() {
      browserHistory.push('/data/'+this.props.activeDepartment);
    }

  render() {
    console.log('is rendered');
    if (this.state.loading) {
      return(<Loading/>);
    }
    return (
      <div>
    <div className="main-window">
        <h1 className="title is-3 mb-40">{this.state.department.name}</h1>

        <button className="button is-info is-small mr-10" onClick={() => this.showMedrecForm(true)} disabled={this.state.showMedrecForm}>Add new medical record</button>

        <button className="button is-info is-small" onClick={this.openDataPage}>Extract data</button>

     { this.state.showMedrecForm && <div className="med-rec-form mt-40">
        <div className="field is-horizontal">
          <div className="field-label is-small">
            <label className="label">Medical record №:</label>
          </div>
          <div className="field-body">
            <div className="field">
              <p className="control">
               <input className="input input-variable  is-small" type="text" value={this.state.newMedrecNumber} onChange={this.changeNewMedrecNumber} />
             </p>
            </div>
          </div>
        </div>
        <div className="field is-horizontal">
          <div className="field-label is-small">
            <label className="label">Additional information</label>
          </div>
          <div className="field-body">
            <div className="field">
              <p className="control">
               <input className="input input-variable  is-small" type="text" value={this.state.additionalInfo} onChange={this.changeAdditionalInfo} />
             </p>
            </div>
          </div>
        </div>
        <div className="field is-grouped mt-20">
          <p className="control">
            <a className="button is-small is-light"  onClick={() => this.showMedrecForm(false)}>Cancel</a>
          </p>
          <p className="control">
            <a className="button is-small is-info" onClick={this.saveMedRec}>Save</a>
          </p>
        </div>
      </div>}
      {this.state.department.elementsInfo &&
      <div className="mt-40">
        <DepartmentStatistics elementsInfo={this.state.department.elementsInfo} depId={this.props.params.id}/>
      </div>
      }
    </div>

    <div className="patients-list mt-40">
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Medical Record</th>
            <th>Additional Info</th>
            <th>Created</th>
            <th><abbr title="Patient is still in the hospital">Opened</abbr></th>
            <th><abbr title="Patient has left hospital">Closed</abbr></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {this.state.department.medrecs.map((medrec, index) => {
            return (
              <tr key={index} onClick={() => this.openPatient(medrec._id)}>
                <th>{index+1}</th>
                <td>{medrec.number}</td>
                <td>{medrec.info}</td>
                <td>{medrec.date}</td>
                <td>{(medrec.isOpened) ? <div><i className="fas fa-check"></i></div> : ''}</td>
                <td>{(!medrec.isOpened) ? <div><i className="fas fa-check"></i></div> : ''}</td>
                <td>{(!medrec.isOpened) ? <a className="button is-info" onClick={(e) => this.download(e, index)}><i className="fas fa-download"></i></a> : ''}</td>
              </tr>
          )
          })}
        </tbody>
      </table>
    </div>
  </div>
    );
  }
}


export default connect(
  mapStateToProps
)(DepartmentPage)
