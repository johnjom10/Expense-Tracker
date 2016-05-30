'use strict'
var fs = require('fs')
var pie = require('./bar')

var data = [
  {
    'category': 'Bills ',
    'amount': 4000
  },
  {
    'category': 'Groceries',
    'amount': 550
  },
  {
    'category': 'Travel',
    'amount': 39
  },
  {
    'category': 'Food & Drinks',
    'amount': 20
  },
  {
    'category': 'Miscellaneous',
    'amount': 5
  },
  {
    'category': 'Investments',
    'amount': 5
  },
  {
    'category': 'Health',
    'amount': 5
  },
  {
    'category': 'Shopping',
    'amount': 5
  },
  {
    'category': 'Entertainment',
    'amount': 5
  },
  {
    'category': 'Fuel',
    'amount': 5
  }
]
pie.barChart(data, function (svg) {
  fs.writeFile('charts/bar.svg', svg, function (err) {
    if (err) {
      console.log('error saving document', err)
    } else {
      console.log('The file was saved!')
    }
  })
})
