/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

*    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

*       http://aws.amazon.com/apache2.0/

*    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

* Module contains handler logic for all intents
*/

var promise = require('bluebird');
var textHelper = require('textHelper');
var AlexaSkill = require('./AlexaSkill');
var dateUtils = require('dateUtils');

var storage = promise.promisifyAll(require('storage'));

var registerIntentHandlers = function(intentHandlers, skillContext) {
	'use strict';
	intentHandlers.AddExpenseIntent = function(intent, session, response) {
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
				storage.addUserAsync(userId, email).then(function() {
					return storage.saveExpense(userId, email, data, response);
				});
			} catch (err) {
				console.log('An Error Occurred');
				response.tell('Sorry, an error occurred. Please try again.');
			}
		}
	};
	intentHandlers.GiveSpendingHabitsIntent = function(intent, session, response) {
		var userId = session.user.userId;
		var data = {};
		var date = intent.slots.date.value;
		var email = session.user.accessToken;
		var speechOutput;
		var speechText;
		var expense;

		data.category = intent.slots.category.value;

		if (!date) {
			data.date = new Date();
		} else {
			data.date = new Date(date);
		}

		if (data.date.getDate() === 1 && data.date.getHours() === 0 && data.date.getMinutes() === 0 && data.date.getSeconds() === 0) {
			if (!(data.category)) {
				storage.getTotalExpenseByMonthAsync(userId, data.date)
					.then(function(result) {
						expense = result;
						speechText = 'You have spent ' + expense + ' dollars on ' + '<say-as interpret-as = "date" format = "my">' + dateUtils.mm(data.date) + '-' + data.date.getFullYear() + ' </say-as>';
					})
					.then(function() {
						storage.getTotalBudgetAsync(userId, data.date)
							.then(function(budget) {
								if (budget === -1) {
									speechText += 'No budget set.';
								} else {
									if (expense > budget) {
										speechText += 'You have exceeded your monthly budget by ' + (expense - budget) + ' dollars.';
									} else {
										speechText += 'Your budget is ' + budget + ' dollars.';
									}
								}
								buildSSMLOutput(email, speechText, response);
							});
					});
			} else {
				storage.getCategoryExpenseByMonthAsync(userId, data.category, data.date)
					.then(function(result) {
						expense = result;
						speechText = 'You have spent ' + expense + ' dollars on ' + data.category + ' on <say-as interpret-as = "date" format = "my">' + dateUtils.mm(data.date) + '-' + data.date.getFullYear() + ' </say-as>';
					})
					.then(function() {
						storage.getCategoryBudgetAsync(userId, data.category, data.date)
							.then(function(budget) {
								if (budget === -1) {
									speechText += 'No budget set.';
								} else {
									if (expense > budget) {
										speechText += 'You have exceeded your monthly budget by ' + (expense - budget) + ' dollars.';
									} else {
										speechText += 'Your budget is ' + budget + ' dollars.';
									}
								}
								buildSSMLOutput(email, speechText, response);
							});
					});
			}
		} else {
			if (!data.category) {
				storage.getExpense(userId, data.date, function(result) {
					speechText = 'You have spent ' + result + ' dollars on ' + '<say-as interpret-as = "date">' + dateUtils.yyyymmdddash(data.date) + ' </say-as>';
					buildSSMLOutput(email, speechText, response);
				});
			} else {
				storage.getExpenseByCategoryAsync(userId, data.category, data.date)
					.then(function(result) {
						speechText = 'You have spent ' + result + ' dollars on ' + data.category + ' on ' + '<say-as interpret-as = "date">' + dateUtils.yyyymmdddash(data.date) + ' </say-as>';
						buildSSMLOutput(email, speechText, response);
					});
			}
		}
	};

	intentHandlers.CancelExpenditureIntent = function(intent, session, response) {
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

	intentHandlers.CancelExpenditureImmediate = function(intent, session, response) {
		var email = session.user.accessToken;
		session.attributes.deleteLast = true;
		response.ask(textHelper.confirmCancellation);
	};

	intentHandlers.SetBudgetIntent = function(intent, session, response) {
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
				storage.setOverallBudget(userId, data, email, response);
			} else {
				storage.setCategoryBudget(userId, data, email, response);
			}
		}
	};

	intentHandlers.ListAllCategoriesIntent = function(intent, session, response) {
		storage.getCategories(response);
	};
	intentHandlers.ListAllExpensesIntent = function(intent, session, response) {
		storage.listExpenses(session.user.userId, intent.slots.date.value, response);
	};
	intentHandlers.OverspendIntent = function(intent, session, response) {
		var userId = session.user.userId;
		var data = {};
		var email = session.user.accessToken;
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
				.then(function(result) {
					if (result === -1) {
						speechOutput = 'You have not set a budget for this month';
						if (!email) {
							response.tellWithLinkCard(speechOutput);
						}
						response.tell(speechOutput);
					} else {
						return storage.getTotalExpenseByMonthAsync(userId, data.date)
							.then(function(exp) {
								if (parseFloat(exp) > parseFloat(result)) {
									speechOutput = 'You have exceeded your budget for this month by ' + (parseFloat(exp) - parseFloat(result)) + ' dollars.';
									if (!email) {
										response.tellWithLinkCard(speechOutput);
									}
									response.tell(speechOutput);
								} else {
									speechOutput = 'You have not exceeded your budget for this month.';
									if (!email) {
										response.tellWithLinkCard(speechOutput);
									}
									response.tell(speechOutput);
								}
							})
							.catch(function(err) {
								console.log('An Error Occurred');
								response.tell('Sorry, an error occurred. Please try again.');
							});
					}
				});
		} else {
			storage.getCategoryBudgetAsync(userId, data.category, data.date)
				.then(function(result) {
					if (result === -1) {
						speechOutput = 'You have not set a budget for this category';
						if (!email) {
							response.tellWithLinkCard(speechOutput);
						}
						response.tell(speechOutput);
					} else {
						return storage.getExpenseByCategoryAsync(userId, data.category, data.date)
							.then(function(exp) {
								if (parseFloat(exp) > parseFloat(result)) {
									speechOutput = 'You have exceeded your  budget for ' + data.category + ' for this month.';
									if (!email) {
										response.tellWithLinkCard(speechOutput);
									}
									response.tell(speechOutput);
								} else {
									speechOutput = 'You have not exceeded your budget for ' + data.category + ' for this month.';
									if (!email) {
										response.tellWithLinkCard(speechOutput);
									}
									response.tell(speechOutput);
								}
							})
							.catch(function(err) {
								console.log('An Error Occurred');
								response.tell('Sorry, an error occurred. Please try again.');
							});
					}
				});
		}
	};

	intentHandlers.OverspendMonth = function(intent, session, response) {
		var userId = session.user.userId;
		var data = {};
		var email = session.user.accessToken;
		var date = new Date();

		data.category = intent.slots.category.value;

		if (!data.category) {
			storage.OverallOverSpentMonth(userId, date, email, response);
		} else {
			storage.CategoryOverSpentMonth(userId, data.category, date, email, response);
		}
	};

	intentHandlers.OverspendCategory = function(intent, session, response) {
		var userId = session.user.userId;
		var data = {};
		var email = session.user.accessToken;
		var date = intent.slots.date.value;

		if (!date) {
			data.date = new Date();
		} else {
			data.date = new Date(date);
		}

		storage.overSpentCategory(userId, data.date, email, response);
	};

	intentHandlers.MostSpendingsMonth = function(intent, session, response) {
		var userId = session.user.userId;
		var data = {};
		var email = session.user.accessToken;

		if (!intent.slots.category.value) {
			data.category = '';
			data.date = new Date();
		} else {
			data.category = intent.slots.category.value;
			data.date = new Date();
		}

		storage.mostSpentMonth(userId, data, email, response);
	};

	intentHandlers.LeastSpendingsMonth = function(intent, session, response) {
		var userId = session.user.userId;
		var data = {};
		var email = session.user.accessToken;

		if (!intent.slots.category.value) {
			data.category = '';
			data.date = new Date();
		} else {
			data.category = intent.slots.category.value;
			data.date = new Date();
		}

		storage.leastSpentMonth(userId, data, email, response);
	};
	intentHandlers.MostSpendingsCategory = function(intent, session, response) {
		var userId = session.user.userId;
		var data = {};
		var email = session.user.accessToken;

		if (!intent.slots.date.value) {
			data.date = new Date();
		} else {
			data.date = new Date(intent.slots.date.value);
		}

		storage.spentMostOn(userId, data, email, response);
	};

	intentHandlers.LeastSpendingsCategory = function(intent, session, response) {
		var userId = session.user.userId;
		var data = {};
		var email = session.user.accessToken;

		if (!intent.slots.date.value) {
			data.date = new Date();
		} else {
			data.date = new Date(intent.slots.date.value);
		}

		storage.spentLeastOn(userId, data, email, response);
	};

	intentHandlers['AMAZON.HelpIntent'] = function(intent, session, response) {
		helpMe(response);
	};

	intentHandlers['AMAZON.YesIntent'] = function(intent, session, response) {
		var email = session.user.accessToken;
		if (session.attributes.deleteLast === true) {
			storage.cancelLastExpense(session.user.userId, response);
		} else {
			helpMe(response);
		}
	};

	intentHandlers['AMAZON.NoIntent'] = function(intent, session, response) {
		var email = session.user.accessToken;
		if (session.attributes.deleteLast === true) {
			if (!email) {
				response.tellWithLinkCard(textHelper.dontCancel);
			}
			response.tell(textHelper.dontCancel);
		} else {
			helpMe(response);
		}
	};

	intentHandlers['AMAZON.StopIntent'] = function(intent, session, response) {
		response.tell('Goodbye. Thank you for using Expense Tracker');
	};
};
var buildSSMLOutput = function(email, speechText, response) {
	var speechOutput = {
		speech: '<speak>' + speechText + '</speak>',
		type: AlexaSkill.speechOutputType.SSML
	};
	if (!email) {
		response.tellWithLinkCard(speechOutput);
	}
	response.tell(speechOutput);
};

var helpMe = function(response) {
	var cardOutput = textHelper.examplesTextCard;
	var cardTitle = 'Expense Tracker Help';
	var speechOutput = textHelper.helpText + textHelper.examplesText;
	var repromptText = 'What do you want to do ?';

	response.askWithCard(speechOutput, repromptText, cardTitle, cardOutput);

};

exports.register = registerIntentHandlers;