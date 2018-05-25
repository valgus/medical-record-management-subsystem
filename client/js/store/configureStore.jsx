import { createStore, applyMiddleware, compose } from 'redux'
import createLogger from 'redux-logger'
import thunk from 'redux-thunk'
import rootReducer from './reducers/index.js'
import logger from 'redux-logger'

import { persistCombineReducers, persistStore  } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web and AsyncStorage for react-native


const persistConfig = {
  key: 'root',
  storage,
}

const createStoreWithMiddleware = compose(
    applyMiddleware(logger, thunk)
  // applyMiddleware(thunk)
)(createStore)




const configureStore = (initialState) => {
  let reducer = persistCombineReducers(persistConfig, rootReducer)
  const store = createStore(reducer, initialState, compose(applyMiddleware(logger, thunk)));

  const persistor = persistStore(store);
  return {store, persistor};
}


export default configureStore;
