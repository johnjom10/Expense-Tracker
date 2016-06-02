/*
 *
 * Module to generate pie chart in svg format
 *
 */
'use strict'
var d3 = require('d3');
var jsdom = require('jsdom');
var strip = require('striptags');

var htmlStub = '';

var pie = (function () {
  return {
    pieChart: function (data, callback) {
      jsdom.env({
        features: { QuerySelector: true }, html: htmlStub, done: function (errors, window) {
          var html = window.document.querySelector('html');

          var SEGMENT = 'category';
          var DATA = 'percentage';

          var width = 700;
          var height = 450;
          var radius = Math.min(width, height) / 3;

          var COLOR_10 = '#25628e';
          var COLOR_9 = '#2f7eb6';
          var COLOR_8 = '#348ccb';
          var COLOR_7 = '#4998d0';
          var COLOR_6 = '#5da3d5';
          var COLOR_5 = '#71afda';
          var COLOR_4 = '#85bae0';
          var COLOR_3 = '#9ac6e5';
          var COLOR_2 = '#aed1ea';
          var COLOR_1 = '#c2ddef';

          var color = d3.scale.ordinal()
            .range([COLOR_1, COLOR_2, COLOR_3,
              COLOR_4, COLOR_5, COLOR_6, COLOR_7, COLOR_8, COLOR_9, COLOR_10]);

          var arc = d3.svg.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

          var pie = d3.layout.pie()
            .sort(null)
            .value(function (d) {
              return d[DATA];
            });

          var svg = d3.select(html).append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('version', '1.1')
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .append('g')
            .attr('transform', 'translate(' + width / 3 + ',' + height / 2 + ')');

          var drawD3Document = function (data) {
            data.forEach(function (d) {
              d[DATA] = +d[DATA];
            });
            var g = svg.selectAll('.arc')
              .data(pie(data))
              .enter().append('g')
              .attr('class', 'arc');

            var count = 0;

            g.append('path')
              .attr('d', arc)
              .attr('id', function (d) { return 'arc-' + (count++); })
              .style('fill', function (d) {
                return color(d.data[SEGMENT]);
              });
            g.append('text').attr('transform', function (d) {
              return 'translate(' + arc.centroid(d) + ')';
            }).attr('dy', '.35em').style('text-anchor', 'middle')
              .text(function (d) {
                return (d.data[DATA] + '%');
              });

            count = 0;
            var legend = svg.selectAll('.legend')
              .data(data).enter()
              .append('g').attr('class', 'legend')
              .attr('legend-id', function (d) {
                return count++;
              })
              .attr('transform', function (d, i) {
                return 'translate(-60,' + (-70 + i * 20) + ')';
              })
              .on('click', function () {
                var arc = d3.select('#arc-' + (this).attr('legend-id'));
                arc.style('opacity', 0.3);
                setTimeout(function () {
                  arc.style('opacity', 1);
                }, 1000);
              });

            legend.append('rect')
              .attr('x', width / 2)
              .attr('width', 18).attr('height', 18)
              .style('fill', function (d) {
                return color(d[SEGMENT]);
              });
            legend.append('text').attr('x', width / 2)
              .attr('y', 9).attr('dy', '.35em')
              .style('text-anchor', 'end').text(function (d) {
              return (d[SEGMENT]);
            });
          }
          drawD3Document(data);
          // save result in an html file, we could also keep it in memory, or export the interesting fragment into a database for later use
          var svgsrc = window.document.documentElement.innerHTML;
          var svgStripped = strip(svgsrc, '<svg><path><text><g><rect>');
          callback(svgStripped);
        } // end jsDom done callback
      });
    }

  }
})();
module.exports = pie;
