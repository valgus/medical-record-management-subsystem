

import React, { Component, PropTypes } from 'react'



class Message extends Component {
  render() {
    return (
      <article className={"info-message message" + ((this.props.isError) ? " is-danger" : " is-info")}>
        <div className="message-body">
          {this.props.message}
        </div>
      </article>
    );
  }
}

export default Message
