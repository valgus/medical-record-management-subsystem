

import React, { Component } from 'react'
import { browserHistory } from 'react-router'

import * as authActions from '../../store/actions/auth'
import * as depActions from '../../store/actions/dep'
import depService from '../../services/department';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'



function mapDispatchToProps(dispatch) {
  return {
    setActiveDepartment: (id) => dispatch(depActions.setActiveDepartment(id)),
    logout: () => dispatch(authActions.logout())
  }
}

function mapStateToProps(state) {
  return {
      user: state.user,
      activeDepartment: state.departments.activeDepartment
  }
}

class LayoutPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      message: null,
      isError: false,
      departments: []
    };

    this.handleSidebarClick = this.handleSidebarClick.bind(this);
    this.renderDepartments = this.renderDepartments.bind(this);
  }


  componentDidMount() {
    console.log(depService);
    const _this = this;
    depService.getAll(this.props.user.id, (err, departments) => {
        if (err || !departments) {
          return _this.setState({isError: true, message: "Error occured. Try later."});
        }
        if (departments.length > 0) {
          _this.setState({departments: departments});
          _this.props.setActiveDepartment(departments[0]._id);
          browserHistory.push("/department/"+departments[0]._id);
        }
    })
  }

  handleSidebarClick(id) {
    if (id === -1) {
      return this.props.logout();
    }
    this.props.setActiveDepartment(id);
    browserHistory.push("/department/"+id);
  }

  renderDepartments() {
    if (this.state.departments && this.state.departments.length > 0) {

      return  (
        <div>
        {this.state.departments.map((department, index) => {
          return <li key={index}><a className={(this.props.activeDepartment === department._id) ? "is-active": ""} onClick={() => this.handleSidebarClick(department._id)}>{department.name}</a></li>
        })}
      </div>
      );
    }
  }

  render() {
    return (
      <div className="layout">
        <section className="is-fullheight">
          <aside className="menu">
            <p className="menu-label has-text-centered">
              Departments
            </p>
            <ul className="menu-list">
              {this.renderDepartments()}
              <li><a onClick={() => this.handleSidebarClick(-1)}>Log out</a></li>
            </ul>
          </aside>
       <div className="content main-content  mt-20">
         {this.props.children}
        </div>
      </section>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LayoutPage)
