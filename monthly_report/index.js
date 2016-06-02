/**
 * Action to send mails to all linked users every month with their Expense Report
 */
'use strict'
var express = require('express');
var async = require('async');
var mailer = require('./mailer');
var charts = require('./charts');
var csv = require('./csv');

var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.send('Welcome To Expense Tracker');
});

app.post('/', function (req, res) {
  var today = new Date();
  if (req.query.caller === 'iftttmaker') {
    if (today.getDate() === 2) {
      async.parallel([
        function (callback) {
          csv.csvGeneration();
          callback(null);
        },
        function (callback) {
          charts.generateCharts(today.getMonth(), today.getFullYear(), callback);
        }
      ],
        function (err, results) {
          mailer.sendMail();
          res.send('success');
        });
    }
  }else {
    res.send('Forbidden');
  }
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
