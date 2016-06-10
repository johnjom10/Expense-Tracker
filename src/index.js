/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
var AlexaSkill = require('./AlexaSkill');
var eventHandlers = require('./eventHandlers');
var intentHandlers = require('./intentHandlers');

var APP_ID = 'amzn1.echo-sdk-ams.app.c89d5a3e-987e-4772-9b47-9257ebd0a4f7'; // replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]"
var skillContext = {};

/**
 * ExpenseTracker is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var ExpenseTracker = function() {
	'use strict';
	AlexaSkill.call(this, APP_ID);
	skillContext.needMoreHelp = true;
};

// Extend AlexaSkill
ExpenseTracker.prototype = Object.create(AlexaSkill.prototype);
ExpenseTracker.prototype.constructor = ExpenseTracker;

eventHandlers.register(ExpenseTracker.prototype.eventHandlers, skillContext);
intentHandlers.register(ExpenseTracker.prototype.intentHandlers, skillContext);

exports.handler = function(event, context) {
	'use strict';
	// Create an instance of the ExpenseTracker skill.
	var expenseTracker = new ExpenseTracker();
	expenseTracker.execute(event, context);
};