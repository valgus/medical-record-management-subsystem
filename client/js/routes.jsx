import React from 'react';
import { Route, Redirect } from 'react-router'
import authService from './services/auth'
import AboutPage from './components/start/AboutPage.jsx'
import StartPage from './components/start/StartPage.jsx'
import LoginPage from './components/start/LoginPage.jsx'

import LayoutPage from './components/main/LayoutPage.jsx'
import DepartmentPage from './components/department/DepartmentPage.jsx'
import MRPage from './components/medrecord/MRPage.jsx'
import DataPage from './components/data/DataPage.jsx'

import ObValue from './components/medrecord/observedvalue/ObValue.jsx'
import Questionnaire from './components/medrecord/questionnaire/Questionnaire.jsx'
import Template from './components/medrecord/template/Template.jsx'

import Attachments from './components/medrecord/folder/Attachments.jsx'
import Folder from './components/medrecord/folder/Folder.jsx'
import OpenElements from './components/medrecord/OpenElements.jsx'

import NotFound from './components/NotFound.jsx'
import ServerError from './components/ServerError.jsx'

const requireAuth = (nextState, replace) => {
  if( !authService.loggedIn()) {
    console.log(`${nextState.location.pathname} requires authentication`)
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname },
    })
  }
}

const routes = (
<Route>
  <Redirect from="/" to="/main" />
  <Route component={StartPage}>
    <Route path="/login" component={LoginPage}/>
    <Route path="/about" component={AboutPage}/>
  </Route>
  <Route component={LayoutPage} path="/main" onEnter={requireAuth}>
    <Route path="/department/:id" component={DepartmentPage}/>
    <Route path="/medrec/:id" component={MRPage}/>
    <Route path="/data/:id" component={DataPage}/>
    <Route path="/ov/:id" component={ObValue}/>
    <Route path="/q/:id" component={Questionnaire}/>
    <Route path="/t/:id" component={Template}/>
    <Route path="/f/:id" component={Folder}/>
    <Route path="/open" component={OpenElements}/>
    <Route path="/attachments" component={Attachments}/>

  </Route>

  <Route path="/whoops" component={ServerError} />
  <Route path="*" component={NotFound} />
</Route>


);

export default routes;
