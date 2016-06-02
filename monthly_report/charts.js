/*
 * Module to generate bar, line and pie charts of expenses in png format  for each linked user
 *
 */
'use strict'
var fs = require('fs');
var line = require('./line');
var pie = require('./pie');
var bar = require('./bar');
var svg_util = require('./svg_util');
var async = require('async');
const pnfs = require('pn/fs');
const svg2png = require('svg2png');

 /*
  * Function to generate graphs in parallel
  */
var generateCharts = function (month, year, callback) {
  async.parallel([
    function (callback) {
      svg_util.getLineJSONObject(month, year, function (json) {
        generateLineGraph(json , function () {
          console.log('Generate Line Graph:' + month + ' ' + year + ' ' + json );
          callback(null);
        });
      });
    },
    function (callback) {
      svg_util.getPercentDetails(month, year, function (json) {
        generatePieChart(json, function () {
          console.log('Generate Pie Graph:' + month + ' ' + year + ' ' + json );
          callback(null);
        });
      });
    },
    function (callback) {
      svg_util.getBarGraphDetails(month, year, function (json) {
        generateBarGraph(json, function () {
          console.log('Generate Bar Graph:' + month + ' ' + year + ' ' + json );
          callback(null);
        });
      });
    }
  ],
    function (err, results) {
      if (err) {
        console.log(err);
      }else {
        console.log(results);
      }
      callback();
    }
  );
}

// The Line Graph

function makeLineFile (data, callback) { 
// creates the files of the line Graph for a single user
  var date = new Date();
  var month = date.getMonth();
  var year = date.getFullYear();
  var fileName = __dirname + '/public/charts/line/' + month + '-' + year + '-line-' + (data.user_id).slice(19);
  line.lineChart(data.user_data, function (svg) {
    fs.writeFile(fileName + '.svg', svg, function (err) {
      if (err) {
        console.log('error saving document', err);
      }else {
        console.log('The file ' + fileName + ' was saved!');
        pnfs.readFile(fileName + '.svg')
          .then(svg2png)
          .then(buffer => pnfs.writeFile(fileName + '.png', buffer)
            .then(callback)
        )
          .catch(e => console.error(e));
      }
    });
  });
}

function generateLineGraph (json, callback) { 
// Genarates the Line Graph File for each user with the help of the makeLineFile function.
  async.each(json, makeLineFile, callback);
}

// The Pie Chart

function makePieChart (data, callback) { 
// creates the files of the Pie Chart for a single user
  var date = new Date();
  var month = date.getMonth();
  var year = date.getFullYear();
  var fileName = __dirname + '/public/charts/pie/' + month + '-' + year + '-pie-' + (data.user_id).slice(19);
  pie.pieChart(data.user_data, function (svg) {
    fs.writeFile(fileName + '.svg', svg, function (err) {
      if (err) {
        console.log('error saving document', err);
      }else {
        console.log('The file ' + fileName + ' was saved!');
        pnfs.readFile(fileName + '.svg')
          .then(svg2png)
          .then(buffer => pnfs.writeFile(fileName + '.png', buffer)
            .then(callback))
          .catch(e => console.error(e))
      }
    });
  });
}

function generatePieChart (json, callback) {
  async.each(json, makePieChart, callback);
}

// The Bar Graph

function makeBarGraph (data, callback) {
  var date = new Date();
  var month = date.getMonth();
  var year = date.getFullYear();
  var fileName = __dirname + '/public/charts/bar/' + month + '-' + year + '-bar-' + (data.user_id).slice(19);
  bar.barChart(data.user_data, function (svg) {
    fs.writeFile(fileName + '.svg', svg, function (err) {
      if (err) {
        console.log('error saving document', err);
      } else {
        console.log('The file ' + fileName + ' was saved!');
        pnfs.readFile(fileName + '.svg')
          .then(svg2png)
          .then(buffer => pnfs.writeFile(fileName + '.png', buffer)
            .then(callback)
        )
          .catch(e => console.error(e))
      }
    });
  });
}

function generateBarGraph (json, callback) {
  async.each(json, makeBarGraph, callback);
}

exports.generateCharts = generateCharts;
