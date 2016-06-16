/**
 * Module to handle database interaction storage logic  
 */

var mysql = require('mysql');
var textHelper = require('textHelper');
var AlexaSkill = require('./AlexaSkill');
var dateUtils = require('dateUtils');
var promise = require('bluebird');
var storage = promise.promisifyAll(require('storage'));
var connection = mysql.createConnection({
	host: 'expensetrackerdb.cfogs9gj979r.us-east-1.rds.amazonaws.com',
	user: 'qb_internsgrp_1',
	password: 'qburst123',
	database: 'expensetrackerdb',
	debug: true,
	port: 3306
});

var storage = (function() {

	function Expense(userId, email, data) {
		'use strict';
		if (data) {
			this.data = data;
		} else {
			this.data = {
				'category': 'Miscellaneous',
				'amount': null,
				'date': null
			};
		}
		this.userId = userId;
		this.email = email;
	}

	Expense.prototype = {

		/**
		 * Store an expense into Db
		 */

		save: function(speechOutput, response) {
			'use strict';
			var date;
			var query;
			var email;
			var amount;
			var category;

			console.log('Expense.save()');

			if (!this.data.date) {
				date = new Date();
			} else {
				date = new Date(this.data.date);
			}

			query = 'INSERT INTO expenses(user_id,category_id, amount, date) VALUES (?,?,?,?)';
			email = this.email;
			amount = this.data.amount;
			category = this.data.category;

			connection.query(query, [this.userId, this.data.category_id, this.data.amount, date], (function(data) {
				return function(err, rows) {
					if (err) {
						console.log(err);
						throw err;
					}

					speechOutput += 'Expense of ' + amount + ' dollars on ' + category + ' added to your diary.';

					if (data.amount < 0) {
						speechOutput = 'The amount was deducted from your expenses';
					}

					if (!email) {
						response.tellWithLinkCard(speechOutput);
					} else {
						response.tell(speechOutput);
					}
				};
			})(this.data));
		}
	};

	return {

		/**
		 * Collects category_id and calls save()
		 */

		saveExpense: function(userId, email, data, response) {
			var currentExpense;
			var date;
			var speechOutput;
			var query = 'SELECT category_id FROM category WHERE category_name = ?';

			console.log('saveExpense() ' + userId + ' ' + email + ' ' + data);

			connection.query(query, [data.category], function(err, rows) {
				if (err) {
					console.log(err);
					throw err;
				}

				if (rows[0] !== undefined) {
					data.category_id = rows[0].category_id;
				} else {
					data.category_id = 1;
					data.category = 'Miscellaneous';
				}

				if (!data.date) {
					date = new Date();
				} else {
					date = new Date(data.date);
				}

				speechOutput = '';

				storage.getTotalExpenseByMonthAsync(userId, date)
					.then(function(monthlyExpense) {
						return storage.getTotalBudgetAsync(userId, date)
							.then(function(monthlyBudget) {
								if (((parseFloat(monthlyExpense) + parseFloat(data.amount)) > monthlyBudget) && monthlyBudget !== -1) {
									speechOutput += 'Oops! Looks like you overspent this month.';
									currentExpense = new Expense(userId, email, data);
									currentExpense.save(speechOutput, response);
								} else {
									storage.getExpenseByCategoryAsync(userId, data.category, date)
										.then(function(categoryExpense) {
											storage.getCategoryBudgetAsync(userId, data.category, date)
												.then(function(categoryBudget) {
													if (((parseFloat(categoryExpense) + parseFloat(data.amount)) > categoryBudget) && categoryBudget !== -1) {
														speechOutput += 'Oops! Looks like you overspent' + ' on ' + data.category + ' this month.';
													}

													currentExpense = new Expense(userId, email, data);
													currentExpense.save(speechOutput, response);
												});
										});
								}
							});
					})
					.catch(function(err) {
						console.log('An Error Occurred' + err);
						response.tell('Sorry, an error occurred. Please try again.');
					});
			});
		},

		/**
		 *  Add user details to db
		 */

		addUser: function(userId, email, callback) {
			var query;

			console.log('addUser() ' + userId + ' ' + email);

			if (email === undefined) {
				callback();
			} else {
				query = 'SELECT * FROM user WHERE ( user_id = ?)';
				connection.query(query, [userId], function(err, rows1) {
					if (err) {
						console.log(err);
						throw err;
					}
					if (rows1.length === 0) {
						query = 'INSERT INTO user(email_id, user_id) VALUES (?,?)';
					} else {
						query = 'UPDATE user SET email_id = ? WHERE user_id = ?';
					}
					connection.query(query, [email, userId], function(err, rows2) {
						if (err) {
							console.log(err);
							throw err;
						}
						callback();
					});
				});
			}
		},

		/**
		 * Sets overall budget for the month specified in data.date
		 */

		setOverallBudget: function(userId, data, email, response) {
			var date;
			var formattedDate;
			var query;
			var speechOutput;

			console.log('setOverallBudget() ' + userId + ' ' + data);

			if (!data.date) {
				date = new Date();
			} else {
				date = new Date(data.date);
			}

			date.setDate(1);
			formattedDate = dateUtils.yyyymmdd(date);
			query = 'SELECT * FROM overall_budget WHERE ( user_id = ? AND month = ? )';
			connection.query(query, [userId, formattedDate], function(err, rows1) {
				if (err) {
					console.log(err);
					return;
				}

				if (rows1.length === 0) {
					query = 'INSERT INTO overall_budget(amount, user_id, month) VALUES (?,?,?)';
				} else {
					query = 'UPDATE overall_budget SET amount = ? WHERE ( user_id = ? AND month = ?)';
				}
				connection.query(query, [data.amount, userId, formattedDate], function(err, rows2) {
					if (err) {
						console.log(err);
						return;
					}

					speechOutput = 'Overall budget' + ' for ' + dateUtils.getmonthNames(date.getMonth()) + ' set as ' + data.amount + ' dollars.';
					if (!email) {
						response.tellWithLinkCard(speechOutput);
					}
					response.tell(speechOutput);
				});
			});
		},

		/**
		 * Sets budget for data.category for month in data.date
		 */

		setCategoryBudget: function(userId, data, email, response) {
			var date;
			var formattedDate;
			var query;
			var overallBudget;
			var speechOutput;

			console.log('setCategoryBudget() ' + userId + ' ' + data);

			if (!data.date) {
				date = new Date();
			} else {
				date = new Date(data.date);
			}

			date.setDate(1);
			formattedDate = dateUtils.yyyymmdd(date);
			query = 'SELECT category_id FROM category WHERE category_name = ?';

			connection.query(query, [data.category], function(err, rows1) {
				if (err) {
					console.log(err);
					return;
				}

				if (rows1[0] !== undefined) {
					data.category_id = rows1[0].category_id;
				} else {
					data.category_id = 1;
				}

				query = 'SELECT amount FROM overall_budget WHERE ( user_id = ? AND month = ? )';

				connection.query(query, [userId, formattedDate], function(err, rows2) {
					if (err) {
						console.log(err);
						return;
					}
					if (rows2.length !== 0) {
						overallBudget = rows2[0].amount;
						if (overallBudget < data.amount) {
							speechOutput = 'Budget not set because category budget cannot be more than overall budget for the month';
							response.tell(speechOutput);
						}
					}
					query = 'SELECT * FROM category_budget WHERE ( user_id = ? AND month = ? AND category_id = ? )';
					connection.query(query, [userId, formattedDate, data.category_id], function(err, rows3) {
						if (err) {
							console.log(err);
							return;
						}
						if (rows3.length === 0) {
							query = 'INSERT INTO category_budget(amount, user_id,category_id, month) VALUES (?,?,?,?)';
						} else {
							query = 'UPDATE category_budget SET amount = ? WHERE ( user_id = ? AND category_id = ? AND month = ?)';
						}
						connection.query(query, [data.amount, userId, data.category_id, formattedDate], function(err, rows4) {
							if (err) {
								console.log(err);
								return;
							}
							speechOutput = 'Budget of ' + data.category + ' for ' + dateUtils.getmonthNames(date.getMonth()) + ' set as ' + data.amount + ' dollars.';
							if (!email) {
								response.tellWithLinkCard(speechOutput);
							}
							response.tell(speechOutput);
						});
					});
				});
			});
		},

		/**
		 * Checks whether overall budget has been exceeded
		 */

		OverallOverSpentMonth: function(userId, date, email, response) {
			var query;
			var speechOutput;

			console.log('OverallOverSpentMonth() ' + userId + ' ' + date);

			query = 'SELECT sum,month(date) as month,overall_budget.amount as budget from (SELECT sum(amount) as sum,date from expenses where user_id = ? AND year(date) = ? group by month(date)) as temp,overall_budget where month(overall_budget.month) = month(temp.date) and user_id = ? and sum > overall_budget.amount';
			connection.query(query, [userId, date.getFullYear(), userId], function(err, rows) {
				if (err) {
					console.log(err);
					return;
				}

				if (rows.length === 0) {
					speechOutput = 'You have not overspent this year.';
					if (!email) {
						response.tellWithLinkCard(speechOutput);
					}
					response.tell(speechOutput);
				}
				speechOutput = 'Budget exceeded during ';
				for (var i = 0; i < rows.length; i++) {
					speechOutput += ', ' + dateUtils.getmonthNames(rows[i].month - 1);
				}
				if (!email) {
					response.tellWithLinkCard(speechOutput);
				}
				response.tell(speechOutput);
			});
		},

		/**
		 * Checks whether category budget has been exceeded
		 */

		CategoryOverSpentMonth: function(userId, category, date, email, response) {
			var query;
			var speechOutput;

			console.log('CategoryOverSpentMonth() ' + userId + ' ' + category + ' ' + date);

			query = ' SELECT sum,month(date) as month,category_budget.amount as budget from (SELECT sum(amount) as sum,expenses.category_id,date from expenses,category where expenses.category_id = category.category_id AND category.category_name = ? AND user_id = ? AND year(date) = ? group by month(date)) as temp,category_budget where month(category_budget.month) = month(temp.date) and category_budget.category_id = temp.category_id and user_id = ? and sum > category_budget.amount';

			connection.query(query, [category, userId, date.getFullYear(), userId], function(err, rows) {
				if (err) {
					console.log(err);
					return;
				}
				if (rows.length === 0) {
					speechOutput = 'You have not overspent on ' + category + ' this year.';
					if (!email) {
						response.tellWithLinkCard(speechOutput);
					}
					response.tell(speechOutput);
				}
				speechOutput = 'Budget for ' + category + ' exceeded during ';
				for (var i = 0; i < rows.length; i++) {
					speechOutput += ', ' + date.Utils.getmonthNames(rows[k].month - 1);
				}
				if (!email) {
					response.tellWithLinkCard(speechOutput);
				}
				response.tell(speechOutput);
			});
		},

		/**
		 * return;s the categories in which budget has been exceeded
		 */

		overSpentCategory: function(userId, date, email, response) {
			var speechOutput;
			var mm = dateUtils.mm(date);
			var queryString = 'SELECT category_name FROM (SELECT SUM(expenses.amount) as sum, category.category_name , category_budget.amount FROM expenses, category, category_budget WHERE expenses.category_id = category.category_id AND category_budget.category_id = category.category_id AND expenses.user_id = category_budget.user_id AND expenses.user_id = ? AND MONTH(expenses.date) = ? AND MONTH(category_budget.month) = ? AND YEAR(expenses.date) = ?  GROUP BY expenses.category_id) AS result where sum > result.amount';

			console.log('overSpentCategory() ' + userId + ' ' + date);

			connection.query(queryString, [userId, mm, mm, date.getFullYear()], function(err, rows) {
				if (err) {
					console.log(err);
					return;
				}
				if (rows.length === 0) {
					speechOutput = 'You have not overspent on  any categories .';
					if (!email) {
						response.tellWithLinkCard(speechOutput);
					}
					response.tell(speechOutput);
				}
				speechOutput = 'Budget exceeded for';
				for (var k in rows) {
					speechOutput += ', ' + rows[k].category_name;
				}
				if (!email) {
					response.tellWithLinkCard(speechOutput);
				}
				response.tell(speechOutput);
			});
		},

		/**
		 * Collects the entire list of categories from db
		 */

		getCategories: function(response) {
			var speechOutput;
			var cardOutput = '';
			var cardTitle;
			var query = 'SELECT * FROM category';

			console.log('getCategories() ');

			connection.query(query, function(err, rows) {
				if (err) {
					console.log(err);
					return;
				}
				cardTitle = 'Available Categories';
				speechOutput = 'The following categories are available';
				for (var i = 0; i < rows.length; i++) {
					speechOutput += ', ' + rows[i].category_name;
					cardOutput += '\n' + rows[i].category_name;
				}
				response.tellWithCard(speechOutput, cardTitle, cardOutput);
			});
		},

		/**
		 * Get total expense of a user in a particular month
		 */

		getTotalExpenseByMonth: function(userId, date, callback) {
			var mm = dateUtils.mm(date);
			var query = 'SELECT SUM(amount) FROM expenses WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?';

			console.log('getTotalExpenseByMonth() ' + userId + ' ' + date);

			connection.query(query, [userId, mm, date.getFullYear()], function(err, expenditure) {
				if (err) {
					console.log(err);
					return;
				}
				if (expenditure[0]['SUM(amount)'] !== null) {
					callback(err, expenditure[0]['SUM(amount)']);
				} else {
					callback(err, 0);
				}
			});
		},

		/**
		 * Get total expense of a user for a particular category in a particular month
		 */

		getCategoryExpenseByMonth: function(userId, category, date, callback) {
			var mm;
			var query;

			console.log('getCategoryExpenseByMonth() ' + userId + ' ' + category + ' ' + date);

			connection.query('SELECT category_id FROM category WHERE category_name = ?', [category], function(err, catId) {
				if (err) {
					console.log(err);
					return;
				}
				if (catId.length === 0) {
					catId[0] = {};
					catId[0].category_id = 1;
				}

				mm = dateUtils.mm(date);
				query = 'SELECT SUM(amount) FROM expenses  WHERE (user_id = ? AND category_id = ? AND MONTH(date) = ? AND YEAR(date) = ?)';

				connection.query(query, [userId, catId[0].category_id, mm, date.getFullYear()], function(err, expenditure) {
					if (err) {
						console.log(err);
						return;
					}
					if (expenditure[0]['SUM(amount)'] !== null) {
						callback(err, expenditure[0]['SUM(amount)']);
					} else {
						callback(err, 0);
					}
				});
			});
		},

		/**
		 * Get total budget of a user for a month
		 */

		getTotalBudget: function(userId, date, callback) {
			var mm = dateUtils.mm(date);
			var query = 'SELECT amount FROM overall_budget WHERE user_id = ? AND MONTH(month) = ? AND YEAR(month) = ?';

			console.log('getTotalBudget() ' + userId + ' ' + date);

			connection.query(query, [userId, mm, date.getFullYear()], function(err, budget) {
				if (err) {
					console.log(err);
					return;
				}
				if (budget.length === 0) {
					callback(err, -1);
				} else {
					callback(err, budget[0].amount);
				}
			});
		},

		/**
		 * Get category wise budget of a user for a month
		 */

		getCategoryBudget: function(userId, category, date, callback) {
			var mm = dateUtils.mm(date);
			var query = 'SELECT amount FROM category_budget,category WHERE category.category_id = category_budget.category_id AND (user_id = ? AND category_name = ? AND MONTH(month) = ? AND YEAR(month) = ?)';

			console.log('getCategoryBudget() ' + userId + ' ' + category + ' ' + date);

			connection.query(query, [userId, category, mm, date.getFullYear()], function(err, budget) {
				if (err) {
					console.log(err);
					return;
				}
				if (budget.length === 0) {
					callback(err, -1);
				} else {
					callback(err, budget[0].amount);
				}
			});
		},

		/**
		 * Get total expense of a user for a given date
		 */

		getExpense: function(userId, date, callback) {
			var formattedDate = dateUtils.yyyymmdd(date);
			var query = 'SELECT SUM(amount) FROM expenses WHERE user_id=? AND date = ?';

			console.log('getExpense() ' + userId + ' ' + date);

			connection.query(query, [userId, formattedDate], function(err, expenditure) {
				if (err) {
					console.log(err);
					return;
				}
				if (expenditure[0]['SUM(amount)'] === null) {
					callback(0);
				} else {
					callback(expenditure[0]['SUM(amount)']);
				}
			});
		},

		/**
		 * Get total expense of a user for a particular category on a given date
		 */

		getExpenseByCategory: function(userId, category, date, callback) {
			var formattedDate = dateUtils.yyyymmdd(date);
			var query = 'SELECT SUM(amount) FROM expenses,category WHERE expenses.category_id = category.category_id AND user_id = ? AND category_name = ? AND date = ?';

			console.log('getExpenseByCategory() ' + userId + ' ' + category + ' ' + date);

			connection.query(query, [userId, category, formattedDate], function(err, expenditure) {
				if (err) {
					console.log(err);
					return;
				}
				if (expenditure[0]['SUM(amount)'] === null) {
					callback(err, 0);
				} else {
					callback(err, expenditure[0]['SUM(amount)']);
				}
			});
		},

		/**
		 * Collects all expenses for the specified date
		 */

		listExpenses: function(userId, date, response) {
			var formattedDate;
			var temp;
			var speechText;
			var query;
			var speechOutput;
			var cardOutput = '';
			var cardTitle;

			console.log('listExpenses() ' + userId + ' ' + date);

			if (!date) {
				temp = new Date();
				formattedDate = dateUtils.yyyymmdd(temp);
			} else {
				temp = new Date(date);
				formattedDate = dateUtils.yyyymmdd(temp);
			}

			query = 'SELECT SUM(amount),category_name FROM expenses,category WHERE ( ( expenses.category_id = category.category_id ) AND date = ? AND user_id = ?) GROUP BY category_name';

			connection.query(query, [formattedDate, userId], function(err, rows) {
				if (err) {
					console.log(err);
					return;
				}
				console.log('Expenses');

				if (rows.length === 0) {
					speechText = 'No Expenses on <say-as interpret-as = "date">' + dateUtils.yyyymmdddash(temp) + ' </say-as>';
				} else {
					speechText = 'Expenses on <say-as interpret-as = "date">' + dateUtils.yyyymmdddash(temp) + ' </say-as>';
					cardTitle = 'Expenses on ' + dateUtils.yyyymmdd(temp);
					console.log(rows);
					for (var i = 0; i < rows.length; i++) {
						if (parseFloat((rows[i]['SUM(amount)'])) > 0) {
							speechText += '<s>' + rows[i]['SUM(amount)'] + ' dollars on ' + rows[i].category_name + '</s>';
							cardOutput += '\n' + rows[i].category_name + ' : $' + rows[i]['SUM(amount)'];
						}
					}
				}
				speechOutput = {
					speech: '<speak>' + speechText + '</speak>',
					type: AlexaSkill.speechOutputType.SSML
				};
				response.tellWithCard(speechOutput, cardTitle, cardOutput);
			});
		},

		/**
		 * Identifies Which category the user spent the most on.
		 */

		spentMostOn: function(userId, data, email, response) {
			var query;
			var speechOutput;
			var date = data.date;
			var mm = (date.getMonth() + 1).toString();

			console.log('spentMostOn() ' + userId + ' ' + data);

			mm = mm[1] ? mm : '0' + mm[0];
			data.mostvalue = 0;
			data.mostcategory = '';
			query = 'SELECT SUM(amount),category_name FROM expenses,category WHERE ( ( expenses.category_id = category.category_id ) AND month(date) = ? AND year(date) = ? AND user_id = ?) GROUP BY category_name';

			connection.query(query, [mm, date.getFullYear(), userId], function(err, rows) {
				if (err) {
					console.log(err);
					return;
				} else {
					if (rows.length === 0) {
						speechOutput = 'You Have no Expenses added.Please Make an entry when you please.';
						if (!email) {
							response.tellWithLinkCard(speechOutput);
						}
						response.tell(speechOutput);
					} else {
						for (var i = 0; i < rows.length; i++) {
							if (data.mostvalue < rows[i]['SUM(amount)']) {
								data.mostvalue = rows[i]['SUM(amount)'];
								data.mostcategory = rows[i].category_name;
							}
						}

						speechOutput = 'You spent most on  ' + data.mostcategory + ' for an amount of  ' + data.mostvalue + ' dollars .';
						if (!email) {
							response.tellWithLinkCard(speechOutput);
						}
						response.tell(speechOutput);
					}
				}
			});
		},

		/**
		 * Identifies Which category the user spent the least on.
		 */

		spentLeastOn: function(userId, data, email, response) {
			var query;
			var speechOutput;
			var date = data.date;
			var mm = (date.getMonth() + 1).toString();

			console.log('spentLeastOn() ' + userId + ' ' + data);

			mm = mm[1] ? mm : '0' + mm[0];
			data.leastvalue = 0;
			data.leastcategory = '';
			query = 'SELECT SUM(amount),category_name FROM expenses,category WHERE ( ( expenses.category_id = category.category_id ) AND month(date) = ? AND year(date) = ? AND user_id = ?) GROUP BY category_name';

			connection.query(query, [mm, date.getFullYear(), userId], function(err, rows) {
				if (err) {
					console.log(err);
					return;
				} else {
					if (rows.length === 0) {
						speechOutput = 'You Have no Expenses added.Please Make an entry when you please.';
						if (!email) {
							response.tellWithLinkCard(speechOutput);
						}
						response.tell(speechOutput);
					} else {
						data.leastvalue = rows[0]['SUM(amount)'];
						data.leastcategory = rows[0].category_name;
						for (var i = 0; i < rows.length; i++) {
							if (data.leastvalue > rows[i]['SUM(amount)']) {
								data.leastvalue = rows[i]['SUM(amount)'];
								data.leastcategory = rows[i].category_name;
							}
						}

						speechOutput = 'You spent least on  ' + data.leastcategory + ' for an amount of  ' + data.leastvalue + ' dollars .';
						if (!email) {
							response.tellWithLinkCard(speechOutput);
						}
						response.tell(speechOutput);
					}
				}
			});
		},

		/**
		 * Identifies which month the user spent the most on.
		 */

		mostSpentMonth: function(userId, data, email, response) {
			var query;
			var speechOutput;

			console.log('mostSpentMonth() ' + userId + ' ' + data);

			if (data.category !== '') {
				query = 'SELECT max,monthid FROM (SELECT SUM(expenses.amount) as max,MONTH(date) as monthid  FROM expenses,category WHERE expenses.category_id = category.category_id AND user_id = ? AND year(date) = ? AND category.category_name = ? GROUP BY MONTH(date)) as result ORDER BY result.max DESC';

				connection.query(query, [userId, data.date.getFullYear(), data.category], function(err, rows) {
					if (err) {
						console.log(err);
					} else {
						if (!rows[0]) {
							speechOutput = 'You have not spend anything so far for ' + data.category + ' this year .';
							if (!email) {
								response.tellWithLinkCard(speechOutput);
							}
							response.tell(speechOutput);
						} else {
							speechOutput = 'You have spent the most during ' + dateUtils.getmonthNames(rows[0].monthid - 1) + ' for an amount of ' + rows[0].max + ' dollars .';
							if (!email) {
								response.tellWithLinkCard(speechOutput);
							}
							response.tell(speechOutput);
						}
					}
				});
			} else {
				query = 'SELECT max,monthid from (SELECT SUM(amount) as max ,MONTH(date) as monthid  from expenses WHERE user_id = ? AND YEAR(date) = ? GROUP BY MONTH(date)) as result ORDER BY result.max DESC ';
				connection.query(query, [userId, data.date.getFullYear()], function(err, rows) {
					if (err) {
						console.log(err);
					} else {
						if (!rows[0]) {
							speechOutput = 'You have not spend anything so far this year';
							if (!email) {
								response.tellWithLinkCard(speechOutput);
							}
							response.tell(speechOutput);
						} else {
							speechOutput = 'You have spent the most during ' + dateUtils.getmonthNames(rows[0].monthid - 1) + ' for an amount of ' + rows[0].max + ' dollars .';
							if (!email) {
								response.tellWithLinkCard(speechOutput);
							}
							response.tell(speechOutput);
						}
					}
				});
			}
		},

		/**
		 * Identifies which month the user spent the least on.
		 */

		leastSpentMonth: function(userId, data, email, response) {
			var query;
			var speechOutput;

			console.log('leastSpentMonth() ' + userId + ' ' + data);

			if (data.category !== '') {
				query = 'SELECT min,monthid FROM (SELECT SUM(expenses.amount) as min,MONTH(date) as monthid  FROM expenses,category WHERE expenses.category_id = category.category_id AND user_id = ? AND year(date) = ? AND category.category_name = ? GROUP BY MONTH(date)) as result ORDER BY result.min ASC';

				connection.query(query, [userId, data.date.getFullYear(), data.category], function(err, rows) {
					if (err) {
						console.log(err);
					} else {
						if (!rows[0]) {
							speechOutput = 'You have not spend anything so far for ' + data.category + ' this year .';
							if (!email) {
								response.tellWithLinkCard(speechOutput);
							}
							response.tell(speechOutput);
						} else {
							speechOutput = 'You have spent the least on ' + data.category + ' during ' + dateUtils.getmonthNames(rows[0].monthid - 1) + ' for an amount of ' + rows[0].min + ' dollars . ';
							if (!email) {
								response.tellWithLinkCard(speechOutput);
							}
							response.tell(speechOutput);
						}
					}
				});
			} else {
				query = 'SELECT min,monthid from (SELECT SUM(amount) as min ,MONTH(date) as monthid  from expenses WHERE user_id = ? AND YEAR(date) = ? GROUP BY MONTH(date)) as result ORDER BY result.min ASC ';
				connection.query(query, [userId, data.date.getFullYear()], function(err, rows) {
					if (err) {
						console.log(err);
					} else {
						if (!rows[0]) {
							speechOutput = 'You have not spend anything so far this year';
							if (!email) {
								response.tellWithLinkCard(speechOutput);
							}
							response.tell(speechOutput);
						} else {
							speechOutput = 'You have spent the least during ' + dateUtils.getmonthNames(rows[0].monthid - 1) + ' for an amount of ' + rows[0].min + ' dollars';
							if (!email) {
								response.tellWithLinkCard(speechOutput);
							}
							response.tell(speechOutput);
						}
					}
				});
			}
		},

		/**
		 * Deletes the last entry in the expenses table for the specified user
		 */

		cancelLastExpense: function(userId, response) {
			var query = 'DELETE FROM expenses WHERE user_id = ? ORDER BY id DESC LIMIT 1';

			console.log('cancelLastExpense() ' + userId + ' ');

			connection.query(query, [userId], function(err, rows) {
				if (err) {
					console.log(err);
					return;
				}

				response.tell(textHelper.cancelledExpense);
			});
		}
	};
})();
module.exports = storage;