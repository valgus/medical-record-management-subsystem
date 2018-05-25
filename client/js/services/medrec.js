import axios from 'axios'

const DEP_URL = `/medrec/`;

export default {

  get: (depId, mrId, callback) => {
    const url = DEP_URL + '?dId=' + depId + '&mrId=' + mrId
    return get(url, callback);
  },

  addElement: (elementId, mrId, callback) => {
    const data = {
      elementId,
      mrId,
    }
    const url = DEP_URL + 'add';
    return post(url, data, callback);
  },


  getObValue: (id, callback) => {
    console.log(id);
    const url = DEP_URL + 'obValue?id=' + id
    return get(url, callback);
  },


  saveObValue: (data, callback) => {
    const url = DEP_URL + 'obValue';
    return post(url, data, callback);
  },

  deleteObserving: (data, callback) => {
    const url = DEP_URL + 'deleteObValue';
    return post(url, data, callback);
  },

  getQuestionnaire: (id, callback) => {
    console.log(id);
    const url = DEP_URL + 'questionnaire?id=' + id
    return get(url, callback);
  },

  saveQuestionnaire : (data, callback) => {
    const url = DEP_URL + 'questionnaire';
    return post(url, data, callback);
  },

  getTemplate: (id, callback) => {
    console.log(id);
    const url = DEP_URL + 'template?id=' + id
    return get(url, callback);
  },


  completeElement: (data, callback) => {
    const url = DEP_URL + 'completeElement';
    return post(url, data, callback);
  },

  saveTemplate: (data, callback) => {
    const url = DEP_URL + 'template';
    return post(url, data, callback);
  },

  getAnswers: (data, callback) => {
    const url = DEP_URL + 'templateAnswers';
    return post(url, data, callback);
  },

  setMedRecStatus: (data, callback) => {
    const url = DEP_URL + 'setStatus';
    return post(url, data, callback);
  },

  getRecentAttachments: (id, callback) => {
    console.log(id);
    const url = DEP_URL + 'recentFiles?id=' + id
    return get(url, callback);
  },

  getAttachments: (id, mrId, callback) => {
    console.log(id);
    const url = DEP_URL + 'files?id=' + id + '&mrId=' + mrId
    return get(url, callback);
  },

  download: (data,  callback) => {
    const url = DEP_URL + 'download';
    return post(url, data, callback);
  },








  delete: (data, callback) => {
    const url = DEP_URL + 'delete';
    return post(url, data, callback);
  },

  getFolder: (id, callback) => {
    console.log(id);
    const url = DEP_URL + 'getFolder?id=' + id
    return get(url, callback);
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
