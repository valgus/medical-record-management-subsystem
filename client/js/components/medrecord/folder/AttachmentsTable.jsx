

import React, { Component } from 'react'
import {browserHistory} from 'react-router'
import Loading from '../../Loading.jsx'

import moment from 'moment'

import downloadService from '../../../services/download.js'

class AttachmentsTable extends Component {

  constructor(props) {
    super(props);

    this.download = this.download.bind(this);
}


  download(e, index) {
    downloadService.downloadAttach({id: this.props.attachs[index]._id}, (err, base64) => {
      console.log(err, base64);
      if (err) {
        this.props.onError("Error during attachment downloading.");
      }
      if (base64) {
        // var iframe = "<iframe width='100%' height='100%' src='" + base64 + "'></iframe>"
        // var x = window.open();
        // x.document.open();
        // x.document.write(iframe);
        // x.document.close();
        if (base64.includes("data:image/jpg;base64")) {
          const newTab = window.open();
          newTab.document.body.innerHTML = '<img src="'+base64+'">';
        } else {
          window.open(base64, '_blank');
        }
      } else {
        this.props.onError("File was not generated.");
      }
    });
  }

  render() {


    const attachs = this.props.attachs;
    return (
                 <div className="attachment-container">
                   <table className="table">
                      <thead>
                        <tr>
                          {this.props.showMedrecs && <th>Medical Record</th>}
                          <th>File</th>
                          <th>From</th>
                          <th>Date</th>
                          <th>Size</th>
                          <th>Download</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          attachs.map((attach, index) => {
                            return(
                              <tr key={index}>
                                  {this.props.showMedrecs && <td onClick={() => this.props.openMedrec(attach.mrId)}>{attach.medrec}</td>}
                                <td>
                                  <div className="box med-card has-text-centered">
                                    <span className="icon is-small med-icon"><i className={attach.icon}></i></span>
                                    <p className="med-text">{ attach.filename }</p>
                                  </div>
                                </td>
                                <td>{attach.from}</td>
                                <td>{moment(attach.date).format('MMMM Do YYYY, HH:mm')}</td>
                                <td>{attach.size}</td>
                                <td><a className="button is-primary" onClick={(e) => this.download(e, index)}><i className="fas fa-download"></i></a></td>
                              </tr>
                            )
                          })
                        }
                      </tbody>
                    </table>
                 </div>
      );
  }

}
export default AttachmentsTable
