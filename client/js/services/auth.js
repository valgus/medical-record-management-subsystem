import axios from 'axios'

const AUTH_URL = `/auth/login`;

// Authenticate on behalf of a user to receive an access token
export default {

  login: (user, callback) => {
    return axios.post(AUTH_URL, user)
      .then((response) => {
        const userData = response.data;
        console.log(userData);
        localStorage.setItem('user', JSON.stringify(userData))
        callback(null, userData);
      })
      .catch((err) => {
        callback(new Error('Failed to login'))
      });
  },

  logout: () => {
    localStorage.removeItem('user')
  },


  loggedIn() {
    console.log(localStorage.getItem('user'));
    if(localStorage.getItem('user')) return true;
    return false;
  },

  // Retrieves user from localStorage to persist between page loads
  deserializeUser() {
    console.log('here', localStorage.getItem('user'));
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user'))
    } catch(e) {}
    return user;
  },

}
