import axios from 'axios';
import { browserHistory } from 'react-router';

import * as idbManager from '../../../idb/index.js';


  export function savePlan(menu, planInfo, callback) {
    const body = {
      userId: JSON.parse(localStorage.getItem('user')).id,
      planInfo,
      menu,
    };
    post(`/api/savePlan`, body, (err, res) => {
      console.log('before init');
      idbManager.init();
      idbManager.savePlans(res.data);

      callback(err, res.data);
    });
  }

  export function getPlans(from, callback) {
      const body = {
        from,
        userId: JSON.parse(localStorage.getItem('user')).id,
      };
      post(`/api/getPlans`, body, callback);
    }

  export function getFilledDates(callback) {
    const body = {
      userId: JSON.parse(localStorage.getItem('user')).id,
    };
    post(`/api/getFilledDates`, body, callback);

  }

//athlete-dashboard/plans
  // getPlans(callback) {
  //   this.get(`/api/athlete-dashboard/athlete/stats`, callback);
  // },
  //
  // getSpecificPlan(planId, callback) {
  //   const PLAN_URL = `/api/athlete-dashboard/daily/plan/stats/${planId}`;
  //   this.get(PLAN_URL, callback);
  // },

function  post(url, body, callback) {
      axios.post(url, body, {headers: {}})
        .then((response) => {
          if (response.data.error) {
            callback(500, response.data.error);
          } else {
            callback(null, response)
          }
        })
        .catch((err) => {
          callback(new Error('Failed to get plans'))
        });
    }
