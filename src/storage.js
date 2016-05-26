'use strict'
var mysql = require('mysql')
var textHelper = require('textHelper')
var AlexaSkill = require('./AlexaSkill')

var connection = mysql.createConnection({
  host: 'expensetrackerdb.cfogs9gj979r.us-east-1.rds.amazonaws.com',
  user: 'qb_internsgrp_1',
  password: 'qburst123',
  database: 'expensetrackerdb',
  debug: true,
  port: 3306
})

/**
 * Date utilities
 */

var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

Date.prototype.yyyymmdd = function () {
  var yyyy = this.getFullYear().toString()
  var mm = (this.getMonth() + 1).toString() // getMonth() is zero-based
  var dd = this.getDate().toString()
  return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]) // padding
}

Date.prototype.yyyymmdddash = function () {
  var yyyy = this.getFullYear().toString()
  var mm = (this.getMonth() + 1).toString() // getMonth() is zero-based
  var dd = this.getDate().toString()
  return yyyy + (mm[1] ? mm : '0' + mm[0]) + (dd[1] ? dd : '0' + dd[0]) // padding
}

Date.prototype.mm = function () {
  var mm = (this.getMonth() + 1).toString()
  mm = mm[1] ? mm : '0' + mm[0]
  return mm
}

var storage = (function () {
  function Expense (userId, data) {
    if (data) {
      this.data = data
    } else {
      this.data = {
        'category': 'Miscellaneous',
        'amount': null,
        'date': null
      }
    }
    this.userId = userId
  }

  Expense.prototype = {
    /**
     * Store an expense into Db
     */
    save: function (speechOutput, response) {
      var date
      if (!this.data.date) {
        date = new Date()
      } else {
        date = new Date(this.data.date)
      }

      var query = 'INSERT INTO expenses(user_id,category_id, amount, date) VALUES (?,?,?,?)'
      console.log('Getting Category ID')
      console.log(date)
      connection.query(query, [this.userId, this.data.category_id, this.data.amount, date], (function (data) {
        return function (err, rows) {
          if (err) {
            console.log(err)
            return
          }

          speechOutput += 'Expense added to your diary.'

          if (data.amount < 0) {
            speechOutput = 'The amount was deducted from your expenses'
          }

          response.tell(speechOutput)
        }
      })(this.data))
    }
  }

  return {
    /**
     * Collects category_id and calls save()
     */
    saveExpense: function (userId, data, response) {
      var currentExpense
      var query = 'SELECT category_id FROM category WHERE category_name = ?'

      connection.query(query, [data.category], function (err, rows) {
        if (err) {
          console.log(err)
          return
        }

        if (rows[0] !== undefined) {
          data.category_id = rows[0].category_id
        } else {
          data.category_id = 1
        }

        var date
        if (!data.date) {
          date = new Date()
        } else {
          date = new Date(data.date)
        }
        var speechOutput = ''
        storage.getTotalExpenseByMonth(userId, date, function (monthlyExpense) {
          storage.getTotalBudget(userId, date, function (monthlyBudget) {
            if (((parseFloat(monthlyExpense) + parseFloat(data.amount)) > monthlyBudget) && monthlyBudget !== -1) {
              speechOutput += 'Oops! Looks like you overspent this month.'
              console.log('Checking whether overall budget is exceeded...')
              currentExpense = new Expense(userId, data)
              currentExpense.save(speechOutput, response)
            } else {
              storage.getExpenseByCategory(userId, data.category, date, function (categoryExpense) {
                storage.getCategoryBudget(userId, data.category, date, function (categoryBudget) {
                  if (((parseFloat(categoryExpense) + parseFloat(data.amount)) > categoryBudget) && categoryBudget !== -1) {
                    speechOutput += 'Oops! Looks like you overspent' + ' on ' + data.category + ' this month.'
                  }

                  console.log('Checking whether category-wise budget is exceeded...')
                  currentExpense = new Expense(userId, data)
                  currentExpense.save(speechOutput, response)
                })
              })
            }
          })
        })
      })
    },
    /**
     * Sets overall budget for the month specified in data.date
     */
    setOverallBudget: function (userId, data, response) {
      var date
      if (!data.date) {
        date = new Date()
      } else {
        date = new Date(data.date)
      }
      date.setDate(1)

      var formattedDate = date.yyyymmdd()

      var query = 'SELECT * FROM overall_budget WHERE ( user_id = ? AND month = ? )'
      connection.query(query, [userId, formattedDate], function (err, rows1) {
        if (err) {
          console.log(err)
          return
        }

        if (rows1.length === 0) {
          query = 'INSERT INTO overall_budget(amount, user_id, month) VALUES (?,?,?)'
        } else {
          query = 'UPDATE overall_budget SET amount = ? WHERE ( user_id = ? AND month = ?)'
        }
        connection.query(query, [data.amount, userId, formattedDate], function (err, rows2) {
          if (err) {
            console.log(err)
            return
          }

          var speechOutput = 'Overall budget' + ' for ' + monthNames[date.getMonth()] + ' set as ' + data.amount + ' dollars.'
          response.tell(speechOutput)
        })
      })
    },
    /**
     * Sets budget for data.category for month in data.date
     */
    setCategoryBudget: function (userId, data, response) {
      var date
      if (!data.date) {
        date = new Date()
      } else {
        date = new Date(data.date)
      }

      date.setDate(1)
      var formattedDate = date.yyyymmdd()
      var query = 'SELECT category_id FROM category WHERE category_name = ?'

      connection.query(query, [data.category], function (err, rows1) {
        if (err) {
          console.log(err)
          return
        }

        if (rows1[0] !== undefined) {
          data.category_id = rows1[0].category_id
        } else {
          data.category_id = 1
        }

        query = 'SELECT amount FROM overall_budget WHERE ( user_id = ? AND month = ? )'

        connection.query(query, [userId, formattedDate], function (err, rows2) {
          if (err) {
            console.log(err)
            return
          }
          if (rows2.length !== 0) {
            var overallBudget = rows2[0].amount
            if (overallBudget < data.amount) {
              var speechOutput = 'Budget not set because category budget cannot be more than overall budget for the month'
              response.tell(speechOutput)
              return
            }
          }
          query = 'SELECT * FROM category_budget WHERE ( user_id = ? AND month = ? AND category_id = ? )'
          connection.query(query, [userId, formattedDate, data.category_id], function (err, rows3) {
            if (err) {
              console.log(err)
              return
            }
            if (rows3.length === 0) {
              query = 'INSERT INTO category_budget(amount, user_id,category_id, month) VALUES (?,?,?,?)'
            } else {
              query = 'UPDATE category_budget SET amount = ? WHERE ( user_id = ? AND category_id = ? AND month = ?)'
            }
            connection.query(query, [data.amount, userId, data.category_id, formattedDate], function (err, rows4) {
              if (err) {
                console.log(err)
                return
              }
              var speechOutput = 'Budget of ' + data.category + ' for ' + monthNames[date.getMonth()] + ' set as ' + data.amount + ' dollars.'
              response.tell(speechOutput)
              return
            })
          })
        })
      })
    },
    /**
     * Collects the entire list of categories from db
     */
    getCategories: function (response) {
      var query = 'SELECT * FROM category'
      connection.query(query, function (err, rows) {
        if (err) {
          console.log(err)
          return
        }
        console.log('Categories')
        var speechOutput = 'The following categories are available'
        for (var i = 0; i < rows.length; i++) {
          speechOutput += ', ' + rows[i].category_name
        }
        response.tell(speechOutput)
        return
      })
    },

    /**
     * Get total expense of a user in a particular month
     */
    getTotalExpenseByMonth: function (userId, date, callback) {
      var mm = date.mm()
      var query = 'SELECT SUM(amount) FROM expenses WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?'
      connection.query(query, [userId, mm, date.getFullYear()], function (err, expenditure) {
        if (err) {
          console.log(err)
          return
        }
        if (expenditure[0]['SUM(amount)'] != null) {
          callback(expenditure[0]['SUM(amount)'])
        } else {
          callback(0)
        }
      })
    },
    /**
     * Get total expense of a user for a particular category in a particular month
     */
    getCategoryExpenseByMonth: function (userId, category, date, callback) {
      connection.query('SELECT category_id FROM category WHERE category_name = ?', [category], function (err, catId) {
        if (err) {
          console.log(err)
          return
        }
        if (catId.length === 0) {
          catId[0] = {}
          catId[0].category_id = 1
        }

        var mm = date.mm()

        var query = 'SELECT SUM(amount) FROM expenses  WHERE (user_id = ? AND category_id = ? AND MONTH(date) = ? AND YEAR(date) = ?)'
        connection.query(query, [userId, catId[0].category_id, mm, date.getFullYear()], function (err, expenditure) {
          if (err) {
            console.log(err)
            return
          }
          if (expenditure[0]['SUM(amount)'] != null) {
            callback(expenditure[0]['SUM(amount)'])
          } else {
            callback(0)
          }
        })
      })
    },
    /**
     * Get total budget of a user for a month
     */
    getTotalBudget: function (userId, date, callback) {
      var mm = date.mm()

      var query = 'SELECT amount FROM overall_budget WHERE user_id = ? AND MONTH(month) = ? AND YEAR(month) = ?'
      connection.query(query, [userId, mm, date.getFullYear()], function (err, budget) {
        if (err) {
          console.log(err)
          return
        }
        if (budget.length === 0) {
          callback(-1)
        } else {
          callback(budget[0].amount)
        }
      })
    },
    /**
     * Get category wise budget of a user for a month
     */
    getCategoryBudget: function (userId, category, date, callback) {
      var mm = date.mm()

      var query = 'SELECT amount FROM category_budget,category WHERE category.category_id = category_budget.category_id AND (user_id = ? AND category_name = ? AND MONTH(month) = ? AND YEAR(month) = ?)'
      connection.query(query, [userId, category, mm, date.getFullYear()], function (err, budget) {
        if (err) {
          console.log(err)
          return
        }
        if (budget.length === 0) {
          callback(-1)
        } else {
          callback(budget[0].amount)
        }
      })
    },

    /**
     * Get total expense of a user for a given date
     */
    getExpense: function (userId, date, callback) {
      var formattedDate = date.yyyymmdd()
      var query = 'SELECT SUM(amount) FROM expenses WHERE user_id=? AND date = ?'
      connection.query(query, [userId, formattedDate], function (err, expenditure) {
        if (err) {
          console.log(err)
          return
        }
        if (expenditure[0]['SUM(amount)'] == null) {
          callback(0)
        } else {
          callback(expenditure[0]['SUM(amount)'])
        }
      })
    },

    /**
     * Get total expense of a user for a particular category on a given date
     */
    getExpenseByCategory: function (userId, category, date, callback) {
      var formattedDate = date.yyyymmdd()
      var query = 'SELECT SUM(amount) FROM expenses,category WHERE expenses.category_id = category.category_id AND user_id = ? AND category_name = ? AND date = ?'
      connection.query(query, [userId, category, formattedDate], function (err, expenditure) {
        if (err) {
          console.log(err)
          return
        }
        if (expenditure[0]['SUM(amount)'] == null) {
          callback(0)
        } else {
          callback(expenditure[0]['SUM(amount)'])
        }
      })
    },
    /**
     * Collects all expenses for the specified date
     */
    listExpenses: function (userId, date, response) {
      var formattedDate
      var temp
      var speechText
      if (!date) {
        temp = new Date()
        formattedDate = temp.yyyymmdd()
      } else {
        temp = new Date(date)
        formattedDate = temp.yyyymmdd()
      }

      var query = 'SELECT SUM(amount),category_name FROM expenses,category WHERE ( ( expenses.category_id = category.category_id ) AND date = ? AND user_id = ?) GROUP BY category_name'
      connection.query(query, [formattedDate, userId], function (err, rows) {
        if (err) {
          console.log(err)
          return
        }
        console.log('Expenses')

        if (rows.length === 0) {
          speechText = 'No Expenses on <say-as interpret-as = "date">' + temp.yyyymmdddash() + ' </say-as>'
        } else {
          speechText = 'Expenses on <say-as interpret-as = "date">' + temp.yyyymmdddash() + ' </say-as>'
          console.log(rows)
          for (var i = 0; i < rows.length; i++) {
            if (parseFloat((rows[i]['SUM(amount)'])) > 0) {
              speechText += '<s>' + rows[i]['SUM(amount)'] + ' dollars on ' + rows[i].category_name + '</s>'
            }
          }
        }
        var speechOutput = {
          speech: '<speak>' + speechText + '</speak>',
          type: AlexaSkill.speechOutputType.SSML
        }
        response.tell(speechOutput)
        return
      })
    },
    /**
     * Identifies Which category the user spent the most on.
     */

    spentMostOn: function (userId, data, response) {
      var date = data.date
      var mm = (date.getMonth() + 1).toString()
      mm = mm[1] ? mm : '0' + mm[0]
      data.mostvalue = 0
      data.mostcategory = ''
      var query = 'SELECT SUM(amount),category_name FROM expenses,category WHERE ( ( expenses.category_id = category.category_id ) AND month(date) = ? AND year(date) = ? AND user_id = ?) GROUP BY category_name'
      connection.query(query, [mm, date.getFullYear(), userId], function (err, rows) {
        if (err) {
          console.log(err)
          return
        } else {
          if (rows.length === 0) {
            var speechOutput = 'You Have no Expenses added.Please Make an entry when you please.'
            response.tell(speechOutput)
          } else {
            for (var i = 0; i < rows.length; i++) {
              if (data.mostvalue < rows[i]['SUM(amount)']) {
                data.mostvalue = rows[i]['SUM(amount)']
                data.mostcategory = rows[i]['category_name']
              }
            }

            speechOutput = 'You spent most on  ' + data.mostcategory + ' for an amount of  ' + data.mostvalue + ' dollars .'
            response.tell(speechOutput)
          }
        }
      })
    },

    /**
         * Identifies Which category the user spent the least on.
    */

    spentLeastOn: function (userId, data, response) {
      var date = data.date
      var mm = (date.getMonth() + 1).toString()
      mm = mm[1] ? mm : '0' + mm[0]
      data.leastvalue = 0
      data.leastcategory = ''
      var query = 'SELECT SUM(amount),category_name FROM expenses,category WHERE ( ( expenses.category_id = category.category_id ) AND month(date) = ? AND year(date) = ? AND user_id = ?) GROUP BY category_name'
      connection.query(query, [mm, date.getFullYear(), userId], function (err, rows) {
        if (err) {
          console.log(err)
          return
        } else {
          if (rows.length === 0) {
            var speechOutput = 'You Have no Expenses added.Please Make an entry when you please.'
            response.tell(speechOutput)
          } else {
            data.leastvalue = rows[0]['SUM(amount)']
            data.leastcategory = rows[0]['category_name']
            for (var i = 0; i < rows.length; i++) {
              if (data.leastvalue > rows[i]['SUM(amount)']) {
                data.leastvalue = rows[i]['SUM(amount)']
                data.leastcategory = rows[i]['category_name']
              }
            }

            speechOutput = 'You spent least on  ' + data.leastcategory + ' for an amount of  ' + data.leastvalue + ' dollars .'
            response.tell(speechOutput)
          }
        }
      })
    },

    /**
         * Identifies which month the user spent the most on.
    */
    mostSpentMonth: function (userId, data, response) {
      if (data.category !== '') {
        var query = 'SELECT max,monthid FROM (SELECT SUM(expenses.amount) as max,MONTH(date) as monthid  FROM expenses,category WHERE expenses.category_id = category.category_id AND user_id = ? AND year(date) = ? AND category.category_name = ? GROUP BY MONTH(date)) as result ORDER BY result.max DESC'
        connection.query(query, [userId, data.date.getFullYear(), data.category], function (err, rows) {
          if (err) {
            console.log(err)
          } else {
            if (rows[0] == null) {
              var speechOutput = 'You have not spend anything so far for ' + data.category + ' this year .'
              response.tell(speechOutput)
            } else {
              speechOutput = 'You have spent the most during ' + monthNames[rows[0]['monthid'] - 1] + ' for an amount of ' + rows[0]['max'] + ' dollars .'
              response.tell(speechOutput)
            }
          }
        })
      } else {
        query = 'SELECT max,monthid from (SELECT SUM(amount) as max ,MONTH(date) as monthid  from expenses WHERE user_id = ? AND YEAR(date) = ? GROUP BY MONTH(date)) as result ORDER BY result.max DESC '
        connection.query(query, [userId, data.date.getFullYear()], function (err, rows) {
          if (err) {
            console.log(err)
          } else {
            if (rows[0] == null) {
              var speechOutput = 'You have not spend anything so far this year'
              response.tell(speechOutput)
            } else {
              speechOutput = 'You have spent the most during ' + monthNames[rows[0]['monthid'] - 1] + ' for an amount of ' + rows[0]['max'] + ' dollars .'
              response.tell(speechOutput)
            }
          }
        })
      }
    },

    /**
         * Identifies which month the user spent the least on.
    */

    leastSpentMonth: function (userId, data, response) {
      if (data.category !== '') {
        var query = 'SELECT min,monthid FROM (SELECT SUM(expenses.amount) as min,MONTH(date) as monthid  FROM expenses,category WHERE expenses.category_id = category.category_id AND user_id = ? AND year(date) = ? AND category.category_name = ? GROUP BY MONTH(date)) as result ORDER BY result.min ASC'
        connection.query(query, [userId, data.date.getFullYear(), data.category], function (err, rows) {
          if (err) {
            console.log(err)
          } else {
            if (rows[0] == null) {
              var speechOutput = 'You have not spend anything so far for ' + data.category + ' this year .'
              response.tell(speechOutput)
            } else {
              speechOutput = 'You have spent the least during ' + monthNames[rows[0]['monthid'] - 1] + ' for an amount of ' + rows[0]['min'] + ' dollars . '
              response.tell(speechOutput)
            }
          }
        })
      } else {
        query = 'SELECT min,monthid from (SELECT SUM(amount) as min ,MONTH(date) as monthid  from expenses WHERE user_id = ? AND YEAR(date) = ? GROUP BY MONTH(date)) as result ORDER BY result.min ASC '
        connection.query(query, [userId, data.date.getFullYear()], function (err, rows) {
          if (err) {
            console.log(err)
          } else {
            if (rows[0] == null) {
              var speechOutput = 'You have not spend anything so far this year'
              response.tell(speechOutput)
            } else {
              speechOutput = 'You have spent the least during ' + monthNames[rows[0]['monthid'] - 1] + ' for an amount of ' + rows[0]['min'] + 'dollars'
              response.tell(speechOutput)
            }
          }
        })
      }
    },

    /**
     * Deletes the last entry in the expenses table for the specified user
     */

    cancelLastExpense: function (userId, response) {
      var query = 'DELETE FROM expenses WHERE user_id = ? ORDER BY id DESC LIMIT 1'

      connection.query(query, [userId], function (err, rows) {
        if (err) {
          console.log(err)
          return
        }

        response.tell(textHelper.cancelledExpense)
      })
    }
  }
})()
module.exports = storage
