import axios from 'axios'

const DEP_URL = `/department/`;

export default {

  save: (data, callback) => {
    const url = DEP_URL;
    return post(url, data, callback);
  },

  getAll: (id, callback) => {
    const url = DEP_URL + 'all?id=' + id
    return get(url, callback);
  },

  get: (id, callback) => {
    const url = DEP_URL + '?id=' + id
    return get(url, callback);
  },

  delete: (data, callback) => {
    const url = DEP_URL + 'delete';
    return post(url, data, callback);
  },

  getUserDeps: (id, callback) => {
    const url = DEP_URL + 'userAll?id=' + id
    return get(url, callback);
  },

  setNewName: (id, name, callback) => {
    const url = DEP_URL + 'setName';
    return post(url, {id, name}, callback);
  },

  download: (id, callback) => {
    const data = {
      depId: id,
    }
    const url = DEP_URL + 'download';
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
