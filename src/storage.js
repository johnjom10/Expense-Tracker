'use strict';
var mysql = require('mysql'),
    textHelper = require('textHelper');

var connection = mysql.createConnection({
    host     : 'expensetrackerdb.cfogs9gj979r.us-east-1.rds.amazonaws.com',
    user     : 'qb_internsgrp_1',
    password : 'qburst123',
    database : 'expensetrackerdb',
    debug    : true,
    port     : 3306
});

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
                    
                    var speechOutput = "Expense added to your diary.";
                    if(data.amount != 0) {
                        speechOutput +=''; 
                    }                    
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
        }
        
    };
    
})();
module.exports = storage;