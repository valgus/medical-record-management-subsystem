import React, { Component, PropTypes } from 'react'
import * as authActions from '../../store/actions/auth'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'


function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(authActions, dispatch),
  }
}


const LoginPage = React.createClass({

  getInitialState() {
    return {
      email: '',
      password: '',
      error: null,
    }
  },

  handleSubmit(e) {
    e.preventDefault();
    this.setState({error: null})
    this.props.actions.login({
      username: this.state.email,
      password: this.state.password,
    }, (err) => {
      if(err) this.setState({
        error: 'Wrong credentials',
        password: '',
      })
    })
  },

  handlePasswordChange(e) {
    this.setState({password: e.target.value})
  },

  handleEmailChange(e) {
    this.setState({email: e.target.value})
  },

  render() {
    return (
      <div className="container has-text-centered">
        <div className="box">
            { this.state.error && <div className="text-is-centered mb-15"><h3 className="title is-4"  style={{color: "red"}}>{this.state.error}</h3></div>}
          <form onSubmit={this.handleSubmit} role="form" method="post">
            <div className="field is-grouped">
              <div className="columns" style={{width: "100%"}}>
                  <div className="column"></div>
                <div className="column is-one-third">
                  <label className="label">Email</label>
                  <div className="control has-icons-left">
                    <input name="email" className="input" type="email" autoFocus value={this.state.email}  onChange={this.handleEmailChange} />
                    <span className="icon is-small is-left">
                      <i className="fas fa-user"></i>
                    </span>
                  </div>
                </div>
              <div className="column"></div>
              <div className="column is-one-third">
                <label className="label">Password</label>
                <div className="control has-icons-left">
                  <input name="password" className="input" type="password" value={this.state.password} onChange={this.handlePasswordChange} />
                  <span className="icon is-small is-left">
                    <i className="fas fa-key"></i>
                  </span>
                </div>
              </div>
              <div className="column"></div>
              </div>
            </div>
            <div className="field">
              <div className="control has-text-centered">
                <button className="button is-primary">Login</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  },

})



export default connect(
  null,
  mapDispatchToProps
)(LoginPage)
