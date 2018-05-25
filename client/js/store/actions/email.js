
import emailService from '../../services/email'



export function login(user, callback) {
  return (dispatch, getState) => {
    // console.log('login returned func')
    authService.login(user, (err) => {
      if(err) {
        dispatch({
          type: 'LOGIN_FAILURE',
          error: 'Login failed.',
        });
        if(callback) return callback(err);
      }

      // Success!
      browserHistory.push('/')
      dispatch({
        type: 'LOGIN_SUCCESS',
        user,
      })
      if(callback) return callback(null, user);
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
