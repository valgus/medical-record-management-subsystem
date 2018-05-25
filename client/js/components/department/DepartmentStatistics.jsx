
import React, { Component } from 'react'

import {browserHistory} from 'react-router'

const DepartmentStatistics = React.createClass({

  showMissedObservedValues() {
    browserHistory.push({
      pathname: '/open',
      state: { elements: this.props.elementsInfo.incompleteOvalues, type: 2 }
    })
  },

  showOpenQuestionnaires() {
    browserHistory.push({
      pathname: '/open',
      state: { elements: this.props.elementsInfo.openQuestionnaires, type: 0 }
    })
  },

  showOpenTemplates() {
    browserHistory.push({
      pathname: '/open',
      state: { elements: this.props.elementsInfo.openTemplates, type: 1 }
    })
  },

  showRecentAttachments() {
    browserHistory.push({
      pathname: '/attachments',
      state: {depId: this.props.depId}
    })
  },

  render() {
    return (
      <div className="department-statistics">
        <div className="tile is-ancestor is-vertical">
          <div className="tile">
            <div className="tile is-parent is-6">
              <article className="tile is-child notification is-light has-text-centered stat-container">
                <p className="title is-5">Opened medical records</p>
                <p className="subtitle is-5">{this.props.elementsInfo.openMedRecNumber}</p>
              </article>
            </div>
            <div className="tile is-parent is-6">
              <article className="tile is-child notification is-light has-text-centered stat-container">
                <p className="title is-5">Closed medical records</p>
                <p className="subtitle is-5">{this.props.elementsInfo.closedMedRecNumber}</p>
              </article>
            </div>
          </div>
          <div className="tile">
            <div className="tile is-parent is-3">
              <article className="tile is-child notification is-light stat-container" onClick={this.showMissedObservedValues}>
                <p className="title is-6">Observed values</p>
                <p>New values should be added to {this.props.elementsInfo.incompleteOvalues.length} observed values</p>
              </article>
            </div>
            <div className="tile is-parent is-3">
              <article className="tile is-child notification is-light stat-container" onClick={this.showRecentAttachments}>
                <p className="title is-6">Folders</p>
                <p>See new attachment to the medical records</p>
              </article>
            </div>
            <div className="tile is-parent is-3">
              <article className="tile is-child notification is-light stat-container" onClick={this.showOpenQuestionnaires}>
                <p className="title is-6">Questionnaires</p>
                <p>There are {this.props.elementsInfo.openQuestionnaires.length} questionnaires opened</p>
              </article>
            </div>
            <div className="tile is-parent is-3">
              <article className="tile is-child notification is-light stat-container" onClick={this.showOpenTemplates}>
                <p className="title is-6">Templates</p>
                <p>There are {this.props.elementsInfo.openTemplates.length} templates not completed</p>
              </article>
            </div>
          </div>


        </div>
      </div>
    );
  }
});


export default DepartmentStatistics
