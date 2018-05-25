import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { browserHistory } from 'react-router'

import * as authActions from '../../store/actions/auth'

class StartPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loginIsActive : (this.props.location.pathname === '/login')
    };

    this.handleNavbarClick = this.handleNavbarClick.bind(this);
  }

  handleNavbarClick(e) {
    if (e.target.innerHTML === 'About') {
      this.setState({loginIsActive: false});
      browserHistory.push("/about");
    } else {
      this.setState({loginIsActive: true});
      browserHistory.push("/login");
    }
  }

  render() {
    return (
      <div className="start-wrapper">
        <section className="hero is-primary is-medium">
        <div className="hero-head">
          <nav className="navbar">
            <div className="container">
              <div className="navbar-brand">
                <a className="navbar-item">
                  <p>MRMSS</p>
                </a>
                <span className="navbar-burger burger" data-target="navbarMenuHeroB">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
              <div id="navbarMenuHeroB" className="navbar-menu">
                <div className="navbar-end">
                  <a className={"navbar-item" + ((this.state.loginIsActive) ? " is-active" : "")} onClick={this.handleNavbarClick}>
                    Login
                  </a>
                  <a className={"navbar-item" + ((this.state.loginIsActive) ? "" : " is-active")} onClick={this.handleNavbarClick}>
                    About
                  </a>
                </div>
              </div>
            </div>
          </nav>
        </div>
        <div className="hero-body">
          {this.props.children}
        </div>
      </section>
    </div>
    );
  }

}


export default StartPage;
