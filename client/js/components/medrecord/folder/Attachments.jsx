

import React, { Component } from 'react'
import {browserHistory} from 'react-router'

import Loading from '../../Loading.jsx'
import AttachmentsTable from './AttachmentsTable.jsx'

import moment from 'moment'

import medrecService from '../../../services/medrec.js'

class Attachments extends Component {

  constructor(props) {
    super(props);
    this.state = {
      message: null,
      loading: true,
      isError: false,
      atachs : []
    }
    this.onError = this.onError.bind(this);
    this.openMedrec = this.openMedrec.bind(this);
}

  componentDidMount() {
    medrecService.getRecentAttachments(this.props.location.state.depId, (err, attachs) => {
      if (err) {
        this.setState({
          loading: false, message: "The problem with attachments retrieving occured.", isError: true
        });
        return;
      }
      this.setState({attachs, loading: false});
    });
  }

  onError(error) {
    this.setState({isError: true, message: error});
  }

  openMedrec(id) {
    browserHistory.push('/medrec/'+id);
  }

  render() {

    if (this.state.loading) {
      return (<Loading/>);
    }
    const attachs = this.state.attachs;
    return (
      <div className="content-wrapper">
            { this.state.message && <Message message={this.state.message} isError={this.state.isError} />}
            <div className="mt-40 mb-20">
              <article className="message is-warning">
                <div className="message-body">
                  <p>To send successfully the file to the system the following should be satisfied:</p>
                  <ul>
                    <li>The email with the files should be sent to the address medrecsystemservice@gmail.com</li>
                    <li>The subject of the email should be the number of the medical record to which the attachment should be linked</li>
                    <li>The file must not be larger than 14Mb</li>
                    <li>The file name should be written using one language (no mix of Russian and English letters)</li>
                    <li>Medical record should be opened</li>
                  </ul>
                </div>
              </article>
            </div>
            <h3>Recent attachments</h3>
              <hr/>
               {
                 (!attachs || attachs.length === 0) &&
                 <p><em>No attachments during the last 24 hours.</em></p>
               }
               {
                 attachs && attachs.length > 0 &&
                 <AttachmentsTable attachs={attachs} onError={this.handleError} openMedrec={this.openMedrec} showMedrecs={true}/>
               }
        </div>
      );
  }

}
export default Attachments
