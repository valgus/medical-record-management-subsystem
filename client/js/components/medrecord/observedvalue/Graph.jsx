

import React, { Component } from 'react'

import {Line} from 'react-chartjs-2';

import moment from 'moment';

class Graph extends Component {
  render() {
    const labels = [];
    const values = [];
    const colors = [];
    for (const observing of this.props.obValue.observings) {
        labels.push(moment(observing.date).format('MMMM Do YYYY, HH:mm'));
        if (this.props.obValue.type === 2) {
          values.push(observing.value);
          if (this.props.obValue.critical.some(x => x.min <= observing.value && x.max >= observing.value)) {
            colors.push('red');
          } else {
            colors.push('green')
          }
        } else {
          values.push(this.props.obValue.values[observing.value]);
          if (this.props.obValue.critical[observing.value]) {
            colors.push('red');
          } else {
            colors.push('green')
          }
        }
    }
    const data = {
      labels: labels,
      datasets: [
        {
          label: this.props.obValue.name,
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(220,220,220,1)',
          pointBackgroundColor: colors,
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: colors,
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 3,
          pointHitRadius: 10,
          data: values
        }
      ]
    };

    const options = {
      legend: {
        position: 'left',
        labels: {
          boxWidth: 10
        }
      }
    }
    return (
      <Line data={data} />
    );
  }
}

export default Graph
