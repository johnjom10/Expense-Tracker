/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

*    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

*       http://aws.amazon.com/apache2.0/

*    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

* Module contains handler logic for all intents
*/

'use strict'
var promise = require('bluebird');
var textHelper = require('textHelper');
var AlexaSkill = require('./AlexaSkill');
var dateUtils = require('dateUtils');

var storage = promise.promisifyAll(require('storage'));

var registerIntentHandlers = function (intentHandlers, skillContext) {
  intentHandlers.AddExpenseIntent = function (intent, session, response) {
    var userId = session.user.userId;
    var data = {};
    var email = session.user.accessToken;
    var speechOutput;
    var repromptText;

    if (session.new) {
      data.category = intent.slots.category.value;
      data.date = intent.slots.date.value;
    } else {
      data.category = session.attributes.category;
      data.date = session.attributes.date;
    }

    data.amount = intent.slots.amount.value;

    if (!data.amount) {
      session.attributes.category = data.category;
      session.attributes.date = data.date;
      speechOutput = textHelper.specifyAmount;
      repromptText = textHelper.specifyAmountReprompt;
      response.ask(speechOutput, repromptText);
    } else {
      try {
        storage.addUserAsync(userId, email).then(function () {
          return storage.saveExpense(userId, email, data, response)
        });
      } catch (err) {
        console.log('An Error Occurred');
        response.tell('Sorry, an error occurred. Please try again.');
      }
    }
  };
  intentHandlers.GiveSpendingHabitsIntent = function (intent, session, response) {
    var userId = session.user.userId;
    var data = {};
    var date = intent.slots.date.value;
    var speechOutput;
    var speechText;

    data.category = intent.slots.category.value;

    if (!date) {
      data.date = new Date();
    } else {
      data.date = new Date(date);
    }

    if (data.date.getDate() === 1 && data.date.getHours() === 0 && data.date.getMinutes() === 0 && data.date.getSeconds() === 0) {
      if (!(data.category)) {
        storage.getTotalExpenseByMonth(userId, data.date, function (result) {
          speechText = 'You have spent ' + result + ' dollars on ' + '<say-as interpret-as = "date" format = "my">' + dateUtils.mm(data.date) + data.date.getFullYear() + ' </say-as>';
          buildSSMLOutput(speechText, response);
        });
      } else {
        storage.getCategoryExpenseByMonth(userId, data.category, data.date, function (result) {
          speechText = 'You have spent ' + result + ' dollars on ' + data.category + ' on  <say-as interpret-as = "date" format = "my">' + dateUtils.mm(data.date) + data.date.getFullYear() + ' </say-as>';
          buildSSMLOutput(speechText, response);
        });
      }
    } else {
      if (!data.category) {
        storage.getExpense(userId, data.date, function (result) {
          speechText = 'You have spent ' + result + ' dollars on ' + '<say-as interpret-as = "date">' + dateUtils.yyyymmdddash(data.date) + ' </say-as>';
          buildSSMLOutput(speechText, response);
        });
      } else {
        storage.getExpenseByCategory(userId, data.category, data.date, function (result) {
          speechText = 'You have spent ' + result + ' dollars on ' + data.category + ' on ' + '<say-as interpret-as = "date">' + dateUtils.yyyymmdddash(data.date) + ' </say-as>';
          buildSSMLOutput(speechText, response);
        });
      }
    }
  };

  intentHandlers.CancelExpenditureIntent = function (intent, session, response) {
    var userId = session.user.userId;
    var data = {};
    var email = session.user.accessToken;
    var speechOutput;
    var repromptText;

    if (session.new) {
      data.category = intent.slots.category.value;
      data.date = intent.slots.date.value;
    } else {
      data.category = session.attributes.category;
      data.date = session.attributes.date;
    }

    data.amount = intent.slots.amount.value;

    if (!data.amount) {
      session.attributes.category = data.category;
      session.attributes.date = data.date;
      speechOutput = textHelper.specifyAmount;
      repromptText = textHelper.specifyAmountReprompt;
      response.ask(speechOutput, repromptText);
    } else {
      data.amount = parseInt(data.amount, 10);
      data.amount *= -1;
      storage.saveExpense(userId, email, data, response);
    }
  };

  intentHandlers.CancelExpenditureImmediate = function (intent, session, response) {
      session.attributes.deleteLast = true;
      response.ask(textHelper.confirmCancellation);
  };

  intentHandlers.SetBudgetIntent = function (intent, session, response) {
    var speechOutput;
    var userId = session.user.userId;
    var data = {};

    data.category = intent.slots.category.value;
    data.date = intent.slots.date.value;
    data.amount = intent.slots.amount.value;

    if (!data.amount) {
      speechOutput = textHelper.specifyBudgetAmount + textHelper.setBudgetHelp;
      response.tell(speechOutput);
    } else {
      if (!(data.category)) {
        storage.setOverallBudget(userId, data, response);
      } else {
        storage.setCategoryBudget(userId, data, response);
      }
    }
  };

  intentHandlers.ListAllCategoriesIntent = function (intent, session, response) {
    storage.getCategories(response);
  };
  intentHandlers.ListAllExpensesIntent = function (intent, session, response) {
    storage.listExpenses(session.user.userId, intent.slots.date.value, response);
  };
  intentHandlers.OverspendIntent = function (intent, session, response) {
    var userId = session.user.userId;
    var data = {};
    var date = intent.slots.date.value;
    var speechOutput;

    data.category = intent.slots.category.value;

    if (!date) {
      data.date = new Date();
    } else {
      data.date = new Date(date);
    }

    if (!data.category) {
      storage.getTotalBudgetAsync(userId, data.date)
        .then(function (result) {
          if (result === -1) {
            speechOutput = 'You have not set a budget for this month';
            response.tell(speechOutput);
          } else {
            return storage.getTotalExpenseByMonthAsync(userId, data.date)
              .then(function (exp) {
                if (parseFloat(exp) > parseFloat(result)) {
                  speechOutput = 'You have exceeded your budget for this month.';
                  response.tell(speechOutput);
                } else {
                  speechOutput = 'You have not exceeded your budget for this month.';
                  response.tell(speechOutput);
                }
              })
              .catch(function (err) {
                console.log('An Error Occurred');
                response.tell('Sorry, an error occurred. Please try again.');
              });
          }
        });
    } else {
      storage.getCategoryBudgetAsync(userId, data.category, data.date)
        .then(function (result) {
          if (result === -1) {
            speechOutput = 'You have not set a budget for this category';
            response.tell(speechOutput);
          } else {
            return storage.getExpenseByCategoryAsync(userId, data.category, data.date)
              .then(function (exp) {
                if (parseFloat(exp) > parseFloat(result)) {
                  speechOutput = 'You have exceeded your category budget for this month.';
                  response.tell(speechOutput);
                } else {
                  speechOutput = 'You have not exceeded your category budget for this month.';
                  response.tell(speechOutput);
                }
              })
              .catch(function (err) {
                console.log('An Error Occurred');
                response.tell('Sorry, an error occurred. Please try again.');
              });
          }
        });
    }
  };

  intentHandlers.OverspendMonth = function (intent, session, response) {
    var userId = session.user.userId;
    var data = {};
    var date = new Date();

    data.category = intent.slots.category.value;

    if (!data.category) {
      storage.OverallOverSpentMonth(userId, date, response);
    } else {
      storage.CategoryOverSpentMonth(userId, data.category, date, response);
    }
  };

  intentHandlers.OverspendCategory = function (intent, session, response) {
    var userId = session.user.userId;
    var data = {};
    var date = intent.slots.date.value;

    if (!date) {
      data.date = new Date();
    } else {
      data.date = new Date(date);
    }

    storage.overSpentCategory(userId, data.date, response);
  };

  intentHandlers.MostSpendingsMonth = function (intent, session, response) {
    var userId = session.user.userId;
    var data = {};

    if (!intent.slots.category.value) {
      data.category = '';
      data.date = new Date();
    } else {
      data.category = intent.slots.category.value;
      data.date = new Date();
    }

    storage.mostSpentMonth(userId, data, response);
  }

  intentHandlers.LeastSpendingsMonth = function (intent, session, response) {
    var userId = session.user.userId;
    var data = {};

    if (!intent.slots.category.value) {
      data.category = '';
      data.date = new Date();
    } else {
      data.category = intent.slots.category.value;
      data.date = new Date();
    }

    storage.leastSpentMonth(userId, data, response);
  };
  intentHandlers.MostSpendingsCategory = function (intent, session, response) {
    var userId = session.user.userId;
    var data = {};

    if (!intent.slots.date.value) {
      data.date = new Date();
    } else {
      data.date = new Date(intent.slots.date.value);
    }

    storage.spentMostOn(userId, data, response);
  };

  intentHandlers.LeastSpendingsCategory = function (intent, session, response) {
    var userId = session.user.userId;
    var data = {};

    if (!intent.slots.date.value) {
      data.date = new Date();
    } else {
      data.date = new Date(intent.slots.date.value);
    }

    storage.spentLeastOn(userId, data, response);
  };

  intentHandlers['AMAZON.HelpIntent'] = function (intent, session, response) {
    var speechOutput = textHelper.helpText + textHelper.examplesText;
    var repromptText = 'What do you want to do ?';

    response.ask(speechOutput, repromptText);
  }

  intentHandlers['AMAZON.YesIntent'] = function (intent, session, response) {
    if (session.attributes.deleteLast === true) {
      storage.cancelLastExpense(session.user.userId, response);
    }
  };

  intentHandlers['AMAZON.NoIntent'] = function (intent, session, response) {
    if (session.attributes.deleteLast === true) {
      response.tell(textHelper.dontCancel);
    }
  };

  intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
    response.tell('Goodbye. Thank you for using Expense Tracker');
  };
}
var buildSSMLOutput = function (speechText, response) {
  var speechOutput = {
    speech: '<speak>' + speechText + '</speak>',
    type: AlexaSkill.speechOutputType.SSML
  };
  response.tell(speechOutput);
}
exports.register = registerIntentHandlers;
