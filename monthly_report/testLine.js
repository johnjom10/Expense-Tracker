'use strict'
var fs = require('fs')
var pie = require('./line')

var data = [
  {
    'date': '2016-06-33',
    'amount': 53.98
  },
  {
    'date': '2016-05-28',
    'amount': 67.00
  },
  {
    'date': '2016-05-27',
    'amount': 89.70
  },
  {
    'date': '2016-05-26',
    'amount': 99.00
  },
  {
    'date': '2016-05-23',
    'amount': 130.28
  },
  {
    'date': '2016-05-22',
    'amount': 166.70
  }

]

pie.lineChart(data, function (svg) {
  fs.writeFile('charts/line.svg', svg, function (err) {
    if (err) {
      console.log('error saving document', err)
    } else {
      console.log('The file was saved!')
    }
  })
})
