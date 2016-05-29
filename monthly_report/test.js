'use strict'
var fs = require('fs')
var pie = require('./pie')

var categories = ['one', 'two', 'three', 'four']
var percentage = [20, 50, 29, 1]

pie.pieChart(categories, percentage, function (svg) {
  fs.writeFile('charts/out.svg', svg, function (err) {
    if (err) {
      console.log('error saving document', err)
    } else {
      console.log('The file was saved!')
    }
  })
})
