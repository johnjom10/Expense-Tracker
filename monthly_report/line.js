'use strict'
var d3 = require('d3')

var jsdom = require('jsdom')
var strip = require('striptags')

var htmlStub = ''

var line = (function () {
  return {
    lineChart: function (data, callback) {
      jsdom.env({
        features: { QuerySelector: true }, html: htmlStub, done: function (errors, window) {
          var html = window.document.querySelector('html')

          var margin = {top: 30, right: 20, bottom: 30, left: 50}
          var width = 600 - margin.left - margin.right
          var height = 270 - margin.top - margin.bottom

          // Parse the date / time
          var parseDate = d3.time.format('%Y-%m-%d').parse

          // Set the ranges
          var x = d3.time.scale().range([0, width])
          var y = d3.scale.linear().range([height, 0])

          // Define the axes
          var xAxis = d3.svg.axis().scale(x)
            .orient('bottom').ticks(5)

          var yAxis = d3.svg.axis().scale(y)
            .orient('left').ticks(5)

          // Define the line
          var valueline = d3.svg.line()
            .x(function (d) {
              return x(d.date)
            })
            .y(function (d) {
              return y(d.amount)
            })

          // Adds the svg canvas
          var svg = d3.select(html)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('version', '1.1')
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .append('g')
            .attr('transform',
              'translate(' + margin.left + ',' + margin.top + ')')

          data.forEach(function (d) {
            d.date = parseDate(d.date)
            d.amount = +d.amount
          })
          // Scale the range of the data
          x.domain(d3.extent(data, function (d) {
            return d.date
          }))
          y.domain([0, d3.max(data, function (d) {
            return d.amount
          })])

          // Add the valueline path.
          svg.append('path')
            .attr('class', 'line')
            .attr('d', valueline(data))
            .attr('stroke', 'steelblue')
            .attr('fill', 'none')
            .attr('stroke-width', 2)
          // Add the X Axis
          svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .attr('stroke', 'black')
            .attr('fill', 'none')
            .attr('stroke-width', 1)
            .attr('shape-rendering', 'crispEdges')
            .call(xAxis)

          // Add the Y Axis
          svg.append('g')
            .attr('class', 'y axis')
            .attr('stroke', 'black')
            .attr('fill', 'none')
            .attr('stroke-width', 1)
            .attr('shape-rendering', 'crispEdges')
            .call(yAxis)
          var svgsrc = window.document.documentElement.innerHTML
          var svgStripped = strip(svgsrc, '<svg><path><text><g><rect><line>')
          callback(svgStripped)
        } // end jsDom done callback
      })
    }

  }
})()
module.exports = line
