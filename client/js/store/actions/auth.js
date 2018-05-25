
import { browserHistory } from 'react-router'
import authService from '../../services/auth'



export function login(user, callback) {
  return (dispatch, getState) => {
    // console.log('login returned func')
    authService.login(user, (err, loggedUser) => {
      console.log('useeeeeeeeeeeer', loggedUser);
      if(err) {
        dispatch({
          type: 'LOGIN_FAILURE',
          error: 'Login failed.',
        });
        if(callback) return callback(err);
      }

      // Success!
      dispatch({
        type: 'LOGIN_SUCCESS',
        user: loggedUser,
      })
      browserHistory.push('/')
      if(callback) return callback(null, loggedUser);
    });
  }
}


export function logout() {
  return (dispatch, getState) => {
    authService.logout(); // clears localStorage
    dispatch({
      type: 'LOGOUT_SUCCESS',
    })
    browserHistory.push('/login');
  }

}





// export function increment() {
//   return {
//     type: INCREMENT_COUNTER
//   };
// }

// export function incrementAsync() {
//   return dispatch => {
//     setTimeout(() => {
//       dispatch(increment());
//     }, 1000);
//   };
// }
