// Dependencies for entry point
import "babel-polyfill";
import React from 'react';
import ReactDOM from 'react-dom';
import routes from './routes.jsx';
import authService from './services/auth.js';
import { Router, browserHistory, hashHistory } from 'react-router';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react'
import configureStore from './store/configureStore.jsx';

//Styles used in pages
import '../styles/importer.scss';

// Prepare store
const initialState = {
  user: authService.deserializeUser(),
  departments: {
    activeDepartment: null
  }
};
const configuration = configureStore(initialState);


// Enhanced history. https://github.com/reactjs/react-router-redux
const history = syncHistoryWithStore(browserHistory, configuration.store)


if(document.getElementById('react-root')) {
  ReactDOM.render((
    <Provider store={configuration.store}>
      { /* Tell the Router to use our enhanced history */ }
      <PersistGate loading={null} persistor={configuration.persistor}>
       <Router history={history} children={routes} />
     </PersistGate>
    </Provider>
  ), document.getElementById('react-root'));
}
