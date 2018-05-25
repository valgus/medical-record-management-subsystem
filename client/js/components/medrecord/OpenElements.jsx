

import React, { Component } from 'react'
import {browserHistory} from 'react-router'



const OpenQuestionnaires = React.createClass({

  openMedRec(id) {
    browserHistory.push('/medrec/'+ id);
  },

  openElement(e, id) {
    switch (this.props.location.state.type) {
      case 0:
        browserHistory.push(`/q/${id}`);
        break;
      case 1:
        browserHistory.push(`/t/${id}`);
        break;
      case 2:
        browserHistory.push(`/ov/${id}`);
        break;
      default:

    }
    e.stopPropagation();
  },

  render() {
    const elements = this.props.location.state.elements;
    const type = this.props.location.state.type;
    return (
      <div className="missed-elements-container">
        {type === 0 && <h3>Open questionnaires</h3>}
        {type === 1 && <h3>Open templates</h3>}
        {type === 2 && <h3>Open observed values</h3>}
        <hr/>
         {
           elements.length === 0 &&
           <p><em>No opened 
             {type === 0 && <span>questionnaires</span>}
             {type === 1 && <span>templates</span>}
             {type === 2 && <span>observed values</span>}
             .</em></p>
         }
         {
           elements.length > 0 &&
           <div className="mt-40">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Medical record</th>
                      <th>
                        {type === 0 && 'Questionnaires'}
                        {type === 1 && 'Templates'}
                        {type === 2 && 'Observed values'}
                      </th>
                      <th>Information</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      elements.map((el, index) => {
                        return (
                          <tr key={index}>
                            <td onClick={(e) => this.openMedRec(el.mrId)}>{el.mrName}</td>
                            <td onClick={(e) => this.openElement(e, el.id)}>{el.name}</td>
                            <td>{(el.times) ? 'Observed value was not processed ' + el.times + ' times' : ''}</td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
           </div>
         }
      </div>
    );
  }
})

export default OpenQuestionnaires
