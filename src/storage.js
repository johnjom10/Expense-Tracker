'use strict';
var mysql = require('mysql'),
    textHelper = require('textHelper'),
    AlexaSkill = require('./AlexaSkill');

var connection = mysql.createConnection({
    host     : 'expensetrackerdb.cfogs9gj979r.us-east-1.rds.amazonaws.com',
    user     : 'qb_internsgrp_1',
    password : 'qburst123',
    database : 'expensetrackerdb',
    debug    : true,
    port     : 3306
});

var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];

Date.prototype.yyyymmdd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]); // padding
  };

Date.prototype.yyyymmdddash = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy  + (mm[1]?mm:"0"+mm[0])  + (dd[1]?dd:"0"+dd[0]); // padding
  };

var storage = (function () {
    
    function Expense(user_id,data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {
                'category': "Miscellaneous",
                'amount': null,
                'date': null,
            };
        }
        this.user_id = user_id;
    }
    
    Expense.prototype = {
        /**
         * Store an expense into Db
         */
        save: function (response) {
            var date;
            if(!this.data.date){
                date = new Date();
            }else{
                date = new Date(this.data.date);
            }

            var query = 'INSERT INTO expenses(user_id,category_id, amount, date) VALUES (?,?,?,?)';
            console.log("Getting Category ID");
            console.log(date);
            connection.query(query, [this.user_id,this.data.category_id,this.data.amount,date], (function(data){
                return function(err, rows) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    var speechOutput;
                    speechOutput = "Expense added to your diary.";

                    if (data.amount < 0)
                        speechOutput = "The amount was deducted from your expenses";

                    response.tell(speechOutput);

                };
            })(this.data));
        } 
    };   
    
    return {
        /**
         * Collects category_id and calls save()
         */
        saveExpense: function (user_id,data, response) {
            var currentExpense;
            var query = "SELECT category_id FROM category WHERE category_name = ?";
            
            connection.query(query, [data.category], function(err, rows) {
                if (err) {
                    console.log(err);
                    return;
                }
                
                if(rows[0] !== undefined) {
                    data.category_id = rows[0].category_id;   
                    
                } else {                    
                    data.category_id = 1;
                }
                currentExpense = new Expense(user_id,data);
                currentExpense.save(response);
            });
        },
        /**
         * Sets overall budget for the month specified in data.date
         */
        setOverallBudget: function (user_id,data, response) {
            
            var date;
            if(!data.date){
                
                date = new Date();
            
            }else{

                date = new Date(data.date);
            }
            date.setDate(1);

            var formattedDate = date.yyyymmdd();

            var query = "SELECT * FROM overall_budget WHERE ( user_id = ? AND month = ? )";
            connection.query(query, [user_id, formattedDate], function(err, rows1) {
                if (err) {
                    console.log(err);
                    return;
                }
                if (rows1.length == 0) {
                    query = "INSERT INTO overall_budget(amount, user_id, month) VALUES (?,?,?)";
                }else{               
                    query = "UPDATE overall_budget SET amount = ? WHERE ( user_id = ? AND month = ?)";
                }
                connection.query(query, [data.amount,user_id, formattedDate], function(err, rows2) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    var speechOutput = 'Overall budget' + ' for ' + monthNames[date.getMonth()] + ' set as ' + data.amount + ' dollars.';
                    response.tell(speechOutput);
            	});
        	});
    	},
        /**
         * Sets budget for data.category for month in data.date
         */
        setCategoryBudget: function (user_id,data, response) {
            
            var date;
            if(!data.date){
                
                date = new Date();
            
            }else{

                date = new Date(data.date);
            }
            
            date.setDate(1);
            var formattedDate = date.yyyymmdd();
            var query = "SELECT category_id FROM category WHERE category_name = ?";
            
            connection.query(query, [data.category], function(err, rows1) {
                if (err) {
                    console.log(err);
                    return;
                }
                
                if(rows1[0] !== undefined) {
                    data.category_id = rows1[0].category_id;   
                } else {                    
                    data.category_id = 1;
                }

                query = "SELECT amount FROM overall_budget WHERE ( user_id = ? AND month = ? )";

                connection.query(query, [user_id, formattedDate], function(err, rows2) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    if (rows2.length != 0 ){
                        var overallBudget = rows2[0].amount;
                        if ( overallBudget < data.amount ) {                    
                            var speechOutput = 'Budget not set because category budget cannot be more than overall budget for the month';
                            response.tell(speechOutput);
                            return;
                        }else{
                        	console.log('test');
                        	query = "SELECT * FROM category_budget WHERE ( user_id = ? AND month = ? AND category_id = ? )";
                        	connection.query(query, [user_id, formattedDate, data.category_id], function(err, rows3) {
                            	if (err) {
                                	console.log(err);
                                	return;
                            	}
                            	console.log('insert or update');
                            	if (rows3.length == 0) {
                                	query = "INSERT INTO category_budget(amount, user_id,category_id, month) VALUES (?,?,?,?)";
                            	}else{               
                                	query = "UPDATE category_budget SET amount = ? WHERE ( user_id = ? AND category_id = ? AND month = ?)";
                            	}
                            	connection.query(query, [data.amount,user_id, data.category_id, formattedDate], function(err, rows4) {
                                	if (err) {
                                    	console.log(err);
                                    	return;
                                	}
                                	console.log('budget');
                                	var speechOutput = 'Budget of ' + data.category + ' for ' + monthNames[date.getMonth()] + ' set as ' + data.amount + ' dollars.';
                                	response.tell(speechOutput);
                                	return;
                            	});
                        	});
                    	}
                	}
                });
            });

        },
        /**
         * Collects the entire list of categories from db
         */
        getCategories : function(response){
            var query = 'SELECT * FROM category';
            connection.query(query, function(err, rows) {
            	if (err) {
                    console.log(err);
                    return;
                }
                console.log('Categories');
                var speechOutput = 'The following categories are available';
                for (var i = 0;i < rows.length ; i++){
                	speechOutput += ', ' + rows[i].category_name; 
                }
                response.tell(speechOutput);
                return;
            });

        },

        /**
         * Collects all expenses for the specified date
         */
        listExpenses : function(user_id,date,response){
        	var formattedDate;
        	var temp;
        	var speechText;
        	if(!date){
        		temp = new Date();
        		formattedDate = temp.yyyymmdd();
        	}else{
        		temp = new Date(date);
        		formattedDate = temp.yyyymmdd();
        	}

            var query = 'SELECT amount,category_name FROM expenses,category WHERE ( ( expenses.category_id = category.category_id ) AND date = ? AND user_id = ?)';
            connection.query(query, [formattedDate, user_id], function(err, rows) {
            	if (err) {
                    console.log(err);
                    return;
                }
                console.log('Expenses');

                if (rows.length == 0) {
					speechText = 'No Expenses on <say-as interpret-as = \"date\">' + temp.yyyymmdddash() + ' </say-as>';

                }else{
                	speechText = "Expenses on <say-as interpret-as = \"date\">" + temp.yyyymmdddash() + " </say-as>";
                	console.log(rows);
                	for (var i = 0;i < rows.length ; i++){
                		if(rows[i].amount > 0){
                			speechText += '<s>' + rows[i].amount + ' dollars on ' + rows[i].category_name + '</s>'; 
                		}
                	}
    			}
    			var speechOutput = {
        			speech: '<speak>' + speechText + '</speak>',
        			type: AlexaSkill.speechOutputType.SSML
    			};
            	response.tell(speechOutput);
            	return;
            });

        },
        /**
         * Deletes the last entry in the expenses table for the specified user
         */
        cancelLastExpense: function (user_id,response) {
            var query = "DELETE FROM expenses WHERE user_id = ? ORDER BY id DESC LIMIT 1";
            
            connection.query(query, [user_id], function(err, rows) {
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