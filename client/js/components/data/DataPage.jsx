

import React, { Component } from 'react'
import { connect } from 'react-redux'
import {browserHistory} from 'react-router'

import moment from 'moment'

import Message from '../shared/Message.jsx'
import Loading from '../Loading.jsx'


import networkService from '../../services/network.js'
import departmentService from '../../services/department.js'

class DataPage extends Component {


    constructor(props) {
      super(props);
      this.state = {
        message: null,
        loading: true,
        isError: false,
      }
      this.downloadOtherDepData = this.downloadOtherDepData.bind(this);
      this.downloadDepData = this.downloadDepData.bind(this);
  }

  componentDidMount() {
      networkService.getConfirmations(this.props.params.id, (err, confirmations) => {
        if(err){
          console.log(err);
          this.setState({
            loading: false, message: "The problem with network information retrieving occured.", isError: true
          });
          return;
        }
      this.setState({loading: false, confirmations})
      });
  }

  downloadOtherDepData(depId, url) {
    networkService.download(this.props.params.id, depId, url, (err, data) => {
      if (err) {
        this.setState({
          loading: false, message: "The problem with downloading occured.", isError: true
        });
        return;
      }
      window.open("data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64, " + data);
    });
  }

  downloadDepData() {
    departmentService.download(this.props.params.id, (err, data) => {
        window.open("data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64, " + data);
    });
  }

  render() {
    if (this.state.loading) {
      return (<Loading/>);
    }
    return (
      <div className="data-downloading-container">
        <div className="departmnent-downloading-container mb-20">
          <p><b>Download data of the department</b></p>
          <p style={{fontSize: "0.9em"}}><em>Downloaded file include data from observed values and questionnaires.</em></p>
          <button className="button is-info is-small" onClick={this.downloadDepData}>Download</button>
        </div>
        <div className="other-departmnents-downloading-container">
        <p><b>Download data of other departments</b></p>
          {
            !this.state.confirmations &&
            <p><em>Department is not connected to the network. Go to MRGSS to add this department to obtain/share data with other departments.</em></p>
          }
          {
            this.state.confirmations && this.state.confirmations.length === 0 &&
            <p><em>Department is not given access to the data of any other departments. Go to MRGSS to send requests to other departments to obtain data.</em></p>
          }
          {
            this.state.confirmations && this.state.confirmations.length > 0 &&
            <div>
              <table className="table">
                <thead>
                  <tr>
                   <th></th>
                   <th></th>
                 </tr>
                </thead>
                <tbody>
                  {this.state.confirmations.map((conf, index) => {
                    return(
                      <tr key={index}>
                        <td>{conf.name}</td>
                        <td><a className="button is-info is-small" onClick={() => this.downloadOtherDepData(conf.id, conf.url)}>Download</a></td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
            </div>
          }
        </div>
      </div>
    );
  }
}

export default DataPage
