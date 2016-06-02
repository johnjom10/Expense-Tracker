/*
 *
 * Module to generate bar chart in svg format
 *
 */
'use strict'
var d3 = require('d3');
var jsdom = require('jsdom');
var strip = require('striptags');

var htmlStub = '';

var bar = (function () {
  return {
    barChart: function (data, callback) {
      jsdom.env({
        features: { QuerySelector: true }, html: htmlStub, done: function (errors, window) {
          var html = window.document.querySelector('html');

          var COLOR_COUNTS = 9;

          function Interpolate (start, end, steps, count) {
            var s = start;
            var e = end;
            var final = s + (((e - s) / steps) * count);
            return Math.floor(final);
          }

          function Color (_r, _g, _b) {
            var r, g, b;
            var setColors = function (_r, _g, _b) {
              r = _r;
              g = _g;
              b = _b;
            };

            setColors(_r, _g, _b);
            this.getColors = function () {
              var colors = {
                r: r,
                g: g,
                b: b
              };
              return colors;
            };
          }

          function hexToRgb (hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
            } : null
          }

          var COLOR_FIRST = '#d3e5ff';
          var COLOR_LAST = '#08306B';

          var rgb = hexToRgb(COLOR_FIRST);

          var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);

          rgb = hexToRgb(COLOR_LAST);
          var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);

          var BAR_LABEL = 'category';
          var BAR_VALUE = 'amount';

          var valueById = d3.map();

          var startColors = COLOR_START.getColors();
          var endColors = COLOR_END.getColors();

          var colors = [];

          for (var i = 0; i < COLOR_COUNTS; i++) {
            var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
            var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
            var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
            colors.push(new Color(r, g, b));
          }

          var quantize = d3.scale.quantize()
            .domain([0, 1.0])
            .range(d3.range(COLOR_COUNTS).map(function (i) { return i }));

          function valueFormat (d) {
            if (d > 1000000) {
              return Math.round(d / 1000000 * 10) / 10 + 'M';
            } else if (d > 1000) {
              return Math.round(d / 1000 * 10) / 10 + 'K';
            } else {
              return d;
            }
          }

          quantize.domain([d3.min(data, function (d) {
            return +d[BAR_VALUE];
          }),
            d3.max(data, function (d) {
              return +d[BAR_VALUE];
            })
          ]);

          function makeBars () {
            var names = [];
            var nameValues = [];
            var values = [];
            var chart;
            var width = 400;
            var barHeight = 20;

            data.forEach(function (d) {
              values.push(+d[BAR_VALUE]);
              valueById.set(d[BAR_LABEL], +d[BAR_VALUE]);
              nameValues.push({name: d[BAR_LABEL], value: +d[BAR_VALUE]});
            });

            values = values.sort(function (a, b) {
              return -(a - b);
            });

            nameValues = nameValues.sort(function (a, b) {
              return -(a.value - b.value);
            });

            nameValues.forEach(function (d) {
              names.push(d.name);
            });

            var leftWidth = 150;

            var x = d3.scale.linear()
              .domain([0, d3.max(values)])
              .range([0, width]);

            var xAxis = d3.svg.axis()
              .scale(x)
              .orient('top')
              .tickFormat(function (d) {
                return valueFormat(d);
              });

            var gap = 2;
            // redefine y for adjusting the gap
            var y = d3.scale.ordinal()
              .domain(names)
              .rangeBands([0, (barHeight + 2 * gap) * names.length]);

            chart = d3.select(html)
              .append('svg')
              .attr('class', 'chart')
              .attr('width', leftWidth + width + 100)
              .attr('height', (barHeight + gap * 2) * names.length + 70)
              .attr('version', '1.1')
              .attr('xmlns', 'http://www.w3.org/2000/svg')
              .append('g')
              .attr('transform', 'translate(10, 50)');

            chart.append('g')
              .attr('class', 'x axis')
              .attr('transform', 'translate(' + leftWidth + ', 0)')
              .call(xAxis)
              .append('text')
              .attr('transform', 'rotate(0) translate(0, ' + (-50) + ')')
              .attr('y', 6)
              .attr('dy', '.71em')
              .style('text-anchor', 'right')
              .text('Amount (in Dollars)');

            chart.selectAll('.tick').append('line')
              .attr('x1', 0)
              .attr('x2', 0)
              .attr('y1', 0)
              .attr('y2', (barHeight + gap * 2) * names.length);

            chart.selectAll('rect')
              .data(nameValues)
              .enter().append('rect')
              .attr('x', leftWidth)
              .attr('y', function (d) {
                return y(d.name) + gap;
              })
              .attr('name', function (d, i) {
                return d.name;
              })
              .attr('width', function (d, i) {
                return x(d.value);
              })
              .attr('height', barHeight)
              .style('fill', function (d) {
                return 'steelblue';
              })
              .attr('class', function (d) {
                return 'bar';
              });

            chart.selectAll('text.score')
              .data(nameValues)
              .enter().append('text')
              .attr('x', function (d) {
                return x(d.value) + leftWidth;
              })
              .attr('y', function (d, i) {
                return y(d.name) + y.rangeBand() / 2;
              })
              .attr('dx', 5)
              .attr('dy', '.36em')
              .attr('text-anchor', 'left')
              .attr('class', 'score')
              .text(function (d) {
                return valueFormat('$' + d.value);
              });

            chart.selectAll('text.name')
              .data(nameValues)
              .enter().append('a')
              .attr('target', '_blank')
              .append('text')
              .attr('x', leftWidth / 2)
              .attr('y', function (d, i) {
                return y(d.name) + y.rangeBand() / 2;
              })
              .attr('dy', '.36em')
              .attr('text-anchor', 'middle')
              .text(function (d) {
                return d.name;
              });
          }
          // save result in an html file, we could also keep it in memory, or export the interesting fragment into a database for later use
          makeBars();
          var svgsrc = window.document.documentElement.innerHTML;
          var svgStripped = strip(svgsrc, '<svg><path><text><g><rect><line>');
          callback(svgStripped);
        } // end jsDom done callback
      });
    }

  }
})();
module.exports = bar;
