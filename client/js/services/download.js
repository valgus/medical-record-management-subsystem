import axios from 'axios'

const DEP_URL = `/download/`;

export default {
  download: (data,  callback) => {
    const url = DEP_URL + 'download';
    return post(url, data, callback);
  },

  downloadZip: (data,  callback) => {
    const url = DEP_URL + 'downloadZip';
    return post(url, data, callback);
  },

  downloadAttach: (data,  callback) => {
    const url = DEP_URL + 'downloadAttach';
    return post(url, data, callback);
  },
}


function post(url, data, callback) {
  return axios.post(url, data)
    .then((response) => {
      console.log(response.data);
      return callback(null, response.data);
    })
    .catch((err) => {
      console.log(err.response.data.error);
      return callback(err.response.data.error)
    });
}

function get(url, callback) {
  return axios.get(url)
    .then((response) => {
      console.log(response.data);
      return callback(null, response.data);
    })
    .catch((err) => {
      console.log(err.response.data.error);
      return callback(err.response.data.error);
    });
}
