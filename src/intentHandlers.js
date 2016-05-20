/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var textHelper = require('textHelper'),
    storage = require('storage');
var registerIntentHandlers = function (intentHandlers, skillContext) {
    intentHandlers.AddExpenseIntent = function (intent, session, response) {
        var user_id = session.user.userId;
        var data = {};
        if(session.new == true){
            data.category = intent.slots.category.value;
            data.date = intent.slots.date.value;
        }else{

            data.category = session.attributes.category;
            data.date = session.attributes.date; 
        }

        data.amount = intent.slots.amount.value;
        if(!(data.amount)){
            session.attributes.category = data.category;
            session.attributes.date = data.date;
            var speechOutput = textHelper.specifyAmount;
            var repromptText = textHelper.specifyAmountReprompt;
            response.ask(speechOutput,repromptText);
            return;
        }else{
            storage.saveExpense(user_id,data,response);
        }
    };
    intentHandlers.GiveSpendingHabitsIntent = function (intent, session, response) {
        response.tellWithCard("GiveSpendingHabits", "GiveSpendingHabits", "GiveSpendingHabits");
    };
    intentHandlers.CancelExpenditureIntent = function (intent, session, response) {
        response.tellWithCard("CancelExpenditure", "CancelExpenditure", "CancelExpenditure");
    };
    intentHandlers.CancelExpenditureImmediate = function (intent, session, response) {
        response.tellWithCard("CancelExpenditureImmediate", "CancelExpenditureImmediate", "CancelExpenditureImmediate");
    };
    intentHandlers.SetBudgetIntent = function (intent, session, response) {
        response.tellWithCard("Expense", "Expense", "Expense");
    };
    intentHandlers.MostSpendingsIntent = function (intent, session, response) {
        response.tellWithCard("Expense", "Expense", "Expense");
    };
    intentHandlers['AMAZON.HelpIntent'] = function (intent, session, response) {
        response.ask("help", "help");
    };
    intentHandlers['AMAZON.RepeatIntent'] = function (intent, session, response) {
        response.ask("help", "help");
    };
    intentHandlers['AMAZON.YesIntent'] = function (intent, session, response) {
        response.ask("help", "help");
    };
    intentHandlers['AMAZON.NoIntent'] = function (intent, session, response) {
        response.ask("help", "help");
    };
    intentHandlers['AMAZON.CancelIntent'] = function (intent, session, response) {
        response.ask("help", "help");
    };
    intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
        response.ask("help", "help");
    };
};
exports.register = registerIntentHandlers;
