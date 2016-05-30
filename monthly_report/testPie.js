'use strict'
var fs = require('fs')
var pie = require('./pie')

var data = [
  {
    'category': 'Bills ',
    'percentage': 1
  },
  {
    'category': 'Groceries',
    'percentage': 10
  },
  {
    'category': 'Travel',
    'percentage': 39
  },
  {
    'category': 'Food & Drinks',
    'percentage': 20
  },
  {
    'category': 'Miscellaneous',
    'percentage': 5
  },
  {
    'category': 'Investments',
    'percentage': 5
  },
  {
    'category': 'Health',
    'percentage': 5
  },
  {
    'category': 'Shopping',
    'percentage': 5
  },
  {
    'category': 'Entertainment',
    'percentage': 5
  },
  {
    'category': 'Fuel',
    'percentage': 5
  }
]
pie.pieChart(data, function (svg) {
  fs.writeFile('charts/pie.svg', svg, function (err) {
    if (err) {
      console.log('error saving document', err)
    } else {
      console.log('The file was saved!')
    }
  })
})
