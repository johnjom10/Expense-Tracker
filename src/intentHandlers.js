/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict'
var textHelper = require('textHelper'),
  storage = require('storage')
var registerIntentHandlers = function (intentHandlers, skillContext) {
  intentHandlers.AddExpenseIntent = function (intent, session, response) {
    var user_id = session.user.userId
    var data = {}
    if (session.new == true) {
      data.category = intent.slots.category.value
      data.date = intent.slots.date.value
    }else {
      data.category = session.attributes.category
      data.date = session.attributes.date
    }

    data.amount = intent.slots.amount.value
    if (!(data.amount)) {
      session.attributes.category = data.category
      session.attributes.date = data.date
      var speechOutput = textHelper.specifyAmount
      var repromptText = textHelper.specifyAmountReprompt
      response.ask(speechOutput, repromptText)
      return
    }else {
      storage.saveExpense(user_id, data, response)
    }
  }

  intentHandlers.GiveSpendingHabitsIntent = function (intent, session, response) {
    var user_id = session.user.userId
    var data = {}
    data.category = intent.slots.category.value
    var date = intent.slots.date.value
    var speechOutput
    if (!date) {
      data.date = new Date()
    }else {
      data.date = new Date(date)
    }

    if (data.date.getDate() == 1 && data.date.getHours() == 0 && data.date.getMinutes() == 0 && data.date.getSeconds() == 0) {
      var spentMonth = (data.date.getMonth() + 1) + ' ' + data.date.getFullYear()
      if (!(data.category)) {
        storage.getTotalExpenseByMonth(user_id, data.date, function (result) {
          speechOutput = 'You have spent ' + result + ' dollars on ' + spentMonth
          response.tell(speechOutput)
        })
      }else {
        storage.getCategoryExpenseByMonth(user_id, data.category, data.date, function (result) {
          speechOutput = 'You have spent ' + result + ' dollars on ' + data.category + ' on ' + spentMonth
          response.tell(speechOutput)
        })
      }
    }else {
      var spentDate = data.date.getDate() + ' ' + (data.date.getMonth() + 1) + ' ' + data.date.getFullYear()
      if (!(data.category)) {
        storage.getExpense(user_id, data.date, function (result) {
          speechOutput = 'You have spent ' + result + ' dollars on ' + spentDate
          response.tell(speechOutput)
        })
      }else {
        storage.getExpenseByCategory(user_id, data.category, data.date, function (result) {
          speechOutput = 'You have spent ' + result + ' dollars on ' + data.category + ' on ' + spentDate
          response.tell(speechOutput)
        })
      }
    }
  }

  intentHandlers.CancelExpenditureIntent = function (intent, session, response) {
    var user_id = session.user.userId
    var data = {}
    if (session.new == true) {
      data.category = intent.slots.category.value
      data.date = intent.slots.date.value
    }else {
      data.category = session.attributes.category
      data.date = session.attributes.date
    }

    data.amount = intent.slots.amount.value
    if (!(data.amount)) {
      session.attributes.category = data.category
      session.attributes.date = data.date
      var speechOutput = textHelper.specifyAmount
      var repromptText = textHelper.specifyAmountReprompt
      response.ask(speechOutput, repromptText)
      return
    }else {
      data.amount = parseInt(data.amount, 10)
      data.amount *= -1
      storage.saveExpense(user_id, data, response)
    }
  }

  intentHandlers.CancelExpenditureImmediate = function (intent, session, response) {
    if (session.new == false) {
      response.tell(textHelper.cannotCancel)
    }else {
      session.attributes.deleteLast = true
      response.ask(textHelper.confirmCancellation)
      return
    }
  }

  intentHandlers.SetBudgetIntent = function (intent, session, response) {
    var user_id = session.user.userId
    var data = {}
    data.category = intent.slots.category.value
    data.date = intent.slots.date.value

    data.amount = intent.slots.amount.value

    if (!(data.amount)) {
      var speechOutput = textHelper.specifyBudgetAmount + textHelper.setBudgetHelp
      response.tell(speechOutput)
      return
    }else {
      if (!(data.category))
        storage.setOverallBudget(user_id, data, response)
      else
        storage.setCategoryBudget(user_id, data, response)
    }
  }

  intentHandlers.ListAllCategoriesIntent = function (intent, session, response) {
    storage.getCategories(response)
  }
  intentHandlers.ListAllExpensesIntent = function (intent, session, response) {
    storage.listExpenses(session.user.userId, intent.slots.date.value, response)
  }
  intentHandlers.OverspendIntent = function (intent, session, response) {
    var user_id = session.user.userId
    var data = {}
    data.category = intent.slots.category.value
    var date = intent.slots.date.value
    var speechOutput

    if (!date) {
      data.date = new Date()
    }else {
      data.date = new Date(date)
    }

    if (!(data.category)) {
      storage.getTotalBudget(user_id, data.date, function (result) {
        if (result == -1) {
          speechOutput = 'You have not set a budget for this month'
          response.tell(speechOutput)
        }else {
          // var b = result
          storage.getTotalExpenseByMonth(user_id, data.date, function (exp) {
            if (parseFloat(exp) > parseFloat(result)) {
              speechOutput = 'You have exceeded your budget for this month.'
              response.tell(speechOutput)
            }else {
              speechOutput = 'You have not exceeded your budget for this month.'
              response.tell(speechOutput)
            }
          })
        }
      })
    }else {
      storage.getCategoryBudget(user_id, data.category, data.date, function (result) {
        if (result == -1) {
          speechOutput = 'You have not set a budget for this category'
          response.tell(speechOutput)
        }else {
          storage.getExpenseByCategory(user_id, data.category, data.date, function (exp) {
            if (parseFloat(exp) > parseFloat(result)) {
              speechOutput = 'You have exceeded your category budget for this month.'
              response.tell(speechOutput)
            }else {
              speechOutput = 'You have not exceeded your category budget for this month.'
              response.tell(speechOutput)
            }
          })
        }
      })
    }
  }

  intentHandlers.OverspendMonth = function (intent, session, response) {
    var user_id = session.user.userId
    var data = {}
    data.category = intent.slots.category.value
    var speechOutput
    var date = new Date()
    if (!data.category) {
      storage.OverallOverSpentMonth(user_id, date, response)
    }else {
      storage.CategoryOverSpentMonth(user_id, data.category, date, response)
    }
  }

  intentHandlers.OverspendCategory = function (intent, session, response) {
    var user_id = session.user.userId
    var data = {}
    var date = intent.slots.date.value
    var speechOutput
    if (!date) {
      data.date = new Date()
    }else {
      data.date = new Date(date)
    }
    storage.overSpentCategory(user_id, data.date, response)
  }

  intentHandlers.MostSpendingsMonth = function (intent, session, response) {
    var user_id = session.user.userId
    var data = {}

    if (!intent.slots.category.value) { data.category = ''
      data.date = new Date()
    }else { data.category = intent.slots.category.value
      data.date = new Date()
    }
    storage.mostSpentMonth(user_id, data, response)
  }

  intentHandlers.LeastSpendingsMonth = function (intent, session, response) {
    var user_id = session.user.userId
    var data = {}

    if (!intent.slots.category.value) { data.category = ''
      data.date = new Date()
    }else { data.category = intent.slots.category.value
      data.date = new Date()
    }
    storage.leastSpentMonth(user_id, data, response)
  }
  intentHandlers.MostSpendingsCategory = function (intent, session, response) {
    var user_id = session.user.userId
    var data = {}

    if (!intent.slots.date.value) { data.date = new Date();}else { data.date = new Date(intent.slots.date.value);}
    storage.spentMostOn(user_id, data, response)
  }

  intentHandlers.LeastSpendingsCategory = function (intent, session, response) {
    var user_id = session.user.userId
    var data = {}

    if (!intent.slots.date.value) { data.date = new Date();}else { data.date = new Date(intent.slots.date.value);}
    storage.spentLeastOn(user_id, data, response)
  }

  intentHandlers['AMAZON.HelpIntent'] = function (intent, session, response) {
    var speechOutput = textHelper.helpText + textHelper.examplesText,
      repromptText = 'What do you want to do ?'
    response.ask(speechOutput, repromptText)
  }

  intentHandlers['AMAZON.RepeatIntent'] = function (intent, session, response) {
    response.ask('help', 'help')
  }

  intentHandlers['AMAZON.YesIntent'] = function (intent, session, response) {
    if (session.attributes.deleteLast == true)
      storage.cancelLastExpense(session.user.userId, response)
  }

  intentHandlers['AMAZON.NoIntent'] = function (intent, session, response) {
    if (session.attributes.deleteLast == true)
      response.tell(textHelper.dontCancel)
  }

  intentHandlers['AMAZON.CancelIntent'] = function (intent, session, response) {
    response.ask('help', 'help')
  }

  intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
    response.ask('help', 'help')
  }
}
exports.register = registerIntentHandlers
