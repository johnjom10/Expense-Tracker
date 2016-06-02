/*
 *
 * Utility functions to generate data for graphs
 *
 */
'use strict'
var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'expensetrackerdb.cfogs9gj979r.us-east-1.rds.amazonaws.com',
  user: 'qb_internsgrp_1',
  password: 'qburst123',
  database: 'expensetrackerdb',
  debug: false,
  port: 3306
});

var details = (function () {
  return {
    lineGraphObject: function (month, year, callback) { // returns array of objects in the form {date, Expenditure}
      var query = 'SELECT user_id, DAY(date) AS date, SUM(amount) AS Expenditure FROM expenses WHERE MONTH(date) = ? AND YEAR(date) = ? GROUP BY user_id, DAY(date)';
      connection.query(query, [month, year], function (err, expenses) {
        if (err) {
          console.log(err);
        }else {
          callback(expenses);
        }
      });
    },

    jsonObject: function (arrayOfObjects, callback) {
      var len = arrayOfObjects.length;
      var jsonObj = []; // the final json Object
      var userData = []; // to store the data of a single user
      for (var k = 0;k < len; k++) {
        var data = {}; // store the date and the total expenditure for a day.
        data['date'] = arrayOfObjects[k].date.toString();
        data['amount'] = arrayOfObjects[k].Expenditure;
        userData.push(data);
        var flag = false;
        try {
          if (arrayOfObjects[k + 1].user_id != arrayOfObjects[k].user_id) {
            flag = true;
          }
        } catch(ex) {
          flag = true;
        }
        if (flag) {
          var userObject = {};
          userObject['user_id'] = arrayOfObjects[k].user_id;
          userObject['user_data'] = userData;
          userData = [];
          jsonObj.push(userObject);
        }
      }
      callback(jsonObj);
    },

    getLineJSONObject: function (month, year, callback) { // the driver function to be called.
      details.lineGraphObject(month, year, function (exp) {
        details.jsonObject(exp, callback);
      });
    },

    getCategoryDetails: function (month, year, callback) {
      var query = 'SELECT user_id, category_name, SUM(amount) AS total FROM expenses, category WHERE MONTH(date) = ? AND YEAR(date) = ? AND (expenses.category_id = category.category_id) GROUP BY user_id,category_name';
      connection.query(query, [month, year], function (err, rows) {
        if (err) {
          console.log(err);
        }else {
          callback(rows);
        }
      });
    },

    makeJSONObject: function (categoryDetails, callback) {
      var len = categoryDetails.length;
      var jsonObj = []; // the final json Object
      var userData = []; // to store the data of a single user
      var total = 0;
      for (var k = 0;k < len; k++) {
        var data = {}; // store the category and the expenditure on it.
        data['category'] = categoryDetails[k].category_name;
        data['percentage'] = categoryDetails[k].total; // the expenditure on the category.
        total += data.percentage;
        userData.push(data);
        var flag = false;
        try {
          if (categoryDetails[k + 1].user_id != categoryDetails[k].user_id) {
            flag = true;
          }
        } catch(ex) {
          flag = true;
        }
        if (flag) {
          var userObject = {};
          userObject['user_id'] = categoryDetails[k].user_id;
          for (var j in userData) {
            userData[j].percentage *= (100 / total);
            userData[j].percentage = userData[j].percentage.toFixed(2);
          }
          userObject['user_data'] = userData;
          userData = [];
          total = 0;
          jsonObj.push(userObject);
        }
      }
      callback(jsonObj);
    },
    getPercentDetails: function (month, year, callback) { // driver program
      details.getCategoryDetails(month, year, function (percentages) {
        details.makeJSONObject(percentages, callback);
      });
    },

    barJSON: function (categoryDetails, callback) {
      var len = categoryDetails.length;
      var jsonObj = []; // the final json Object
      var userData = []; // to store the data of a single user
      for (var k = 0;k < len; k++) {
        var data = {}; // store the category and the expenditure on it.
        data['category'] = categoryDetails[k].category_name;
        data['amount'] = categoryDetails[k].total; // the expenditure on the category.
        userData.push(data);
        var flag = false;
        try {
          if (categoryDetails[k + 1].user_id != categoryDetails[k].user_id) {
            flag = true;
          }
        } catch(ex) {
          flag = true;
        }
        if (flag) {
          var userObject = {};
          userObject['user_id'] = categoryDetails[k].user_id;
          userObject['user_data'] = userData;
          userData = [];
          jsonObj.push(userObject);
        }
      }
      callback(jsonObj);
    },

    getBarGraphDetails: function (month, year, callback) {
      details.getCategoryDetails(month, year, function (expenses) {
        details.barJSON(expenses, callback);
      });
    }

  }
})();
module.exports = details;
