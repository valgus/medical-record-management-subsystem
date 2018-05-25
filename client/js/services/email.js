import axios from 'axios'

const EMAIL_URL = `/email/`;


export default {

  saveMember: (email, callback) => {
    const url = EMAIL_URL + '/saveMember'
    return axios.post(url, email)
      .then((response) => {
        console.log(response.data);
        callback(null, response.data);
      })
      .catch((err) => {
        console.log(err);
        callback(new Error(err))
      });
  },

  saveEmployee: (email, callback) => {
    const url = EMAIL_URL + '/saveEmployee'
    console.log(url);
    return axios.post(url, email)
      .then((response) => {
        console.log(response.data);
        callback(null, response.data);
      })
      .catch((err) => {
        callback(new Error(err))
      });
  },

  getAllEmails: (id, callback) => {
    const url = EMAIL_URL + 'all?id=' + id
    console.log(url);
    return axios.get(url)
      .then((response) => {
        console.log(response.data);
        callback(null, response.data);
      })
      .catch((err) => {
        callback(new Error(err))
      });
  },

  deleteEmployee: (data, callback) => {
    const url = EMAIL_URL + 'deleteEmployee';
    console.log(url);
    return axios.post(url, data)
      .then((response) => {
        console.log(response.data);
        callback(null, response.data);
      })
      .catch((err) => {
        callback(new Error(err))
      });
  },


    deleteMember: (data, callback) => {
      const url = EMAIL_URL + 'deleteMember';
      console.log(url);
      console.log(data);
      return axios.post(url, data)
        .then((response) => {
          console.log(response.data);
          callback(null, response.data);
        })
        .catch((err) => {
          callback(new Error(err))
        });
    },
}
