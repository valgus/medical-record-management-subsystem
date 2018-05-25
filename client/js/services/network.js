import axios from 'axios'

const NW_URL = `/network/`;

export default {


  getConfirmations: (id, callback) => {
    const url = NW_URL + 'confirmations?id=' + id;
    return get(url, callback);
  },

  download: (id, depId, endpoint, callback) => {
    const data = {
      depId: id,
      fromId: depId,
      url: endpoint,
    };
    const url = NW_URL + 'download';
    return post(url, data, callback);
  },
}

function post(url, data, callback) {
  return axios.post(url, data)
    .then((response) => {
      console.log(response.data);
      callback(null, response.data);
    })
    .catch((err) => {
      console.log(err);
      callback(new Error(err))
    });
}

function get(url, callback) {
  return axios.get(url)
    .then((response) => {
      console.log(response.data);
      callback(null, response.data);
    })
    .catch((err) => {
      console.log(err);
      callback(new Error(err))
    });
}
