/*
 * Module to generate CSV files of expenses of a month for each linked user
 *
 */
'use strict'
var mysql = require('mysql');
var json2csv = require('json2csv');
var fs = require('fs');

var connection = mysql.createConnection({
  host: 'expensetrackerdb.cfogs9gj979r.us-east-1.rds.amazonaws.com',
  user: 'qb_internsgrp_1',
  password: 'qburst123',
  database: 'expensetrackerdb',
  debug: false,
  port: 3306
});

var mm;
var year;
var date = new Date(); // to get month and and year corresponding to previous year 

var csv = (function () {
  return {

    //  fetching data from DB and Passing it 

    getData: function (callback) { // returns array of objects in the form {date, Expenditure}
      var query = 'SELECT user_id, day(date) as day,amount,category_name as category FROM expenses,category WHERE MONTH(date) = ? AND YEAR(date) = ? AND expenses.category_id = category.category_id GROUP BY user_id, date,category  ';
      if (date.getMonth() == 0) {
        mm = '12';
        year = (date.getFullYear() - 1).toString();
      }else {
        mm = (date.getMonth()).toString();
        year = (date.getFullYear()).toString();
      }
      connection.query(query, [mm, year], function (err, rows) {
        if (err) {
          console.log(err);
        }else {
          callback(rows);
        }
      });
    },

    // conversion of data fetched from DB to required format 

    arrangeCSV: function (dataArray) {
      var len = dataArray.length;
      var userData = [];
      var splits;
      var filename = '';
      var fields = ['date', 'amount', 'category'];

      for (var k = 0;k < len; k++) {
        var data = {};
        data['date'] = dataArray[k].day + '-' + mm + '-' + date.getFullYear();
        data['amount'] = dataArray[k].amount;
        data['category'] = dataArray[k].category;
        userData.push(data);
        var flag = false;
        try {
          if (dataArray[k + 1].user_id != dataArray[k].user_id) {
            flag = true;
          }
        } catch(ex) {
          flag = true;
        }
        if (flag) {
          filename = __dirname + '/public/csv/' + mm + '-' + year + '-csv-' + (dataArray[k].user_id.slice(19) + '.csv');

          json2csv({ data: userData,  fields: fields }, function (err, csv) { // for the conversion of JSON data to CSV file 
            if (err) console.log(err);
            fs.writeFile(filename, csv, function (err) {
              if (err) throw err;
              console.log('CSV File Saved: '+filename);
            });
          });

          userData = [];
        }
      }
    },

    // the driver function to be called.

    csvGeneration: function () {
      csv.getData(function (data) {
        csv.arrangeCSV(data);
      });
    }

  }
})()

module.exports = csv;
