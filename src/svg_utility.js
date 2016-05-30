'use strict';

var mysql = require('mysql');

var connection = mysql.createConnection({
    host     : 'expensetrackerdb.cfogs9gj979r.us-east-1.rds.amazonaws.com',
    user     : 'qb_internsgrp_1',
    password : 'qburst123',
    database : 'expensetrackerdb',
    debug    : false,
    port     : 3306
});

function lineGraphJSONObject(userId, month, year, callback){  //returns array of objects in the form {date, Expenditure}
	var query = 'SELECT DAY(date) AS date, SUM(amount) AS Expenditure FROM expenses WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ? GROUP BY DAY(date)';
	connection.query(query, [userId, month, year], function(err, expenses){
		if(err){
			console.log(err);
		}
		else{
			callback(expenses);
		}
	});
}


/*function print(arrayOfObjects){  //test

function print(arrayOfObjects){  //test
	console.log(arrayOfObjects.length);
	for(var k in arrayOfObjects){
		console.log(arrayOfObjects[k].date+" = "+arrayOfObjects[k].Expenditure);
	}
}
lineGraphJSONObject('amzn1.ask.account.AFP3ZWPOS2BGJR7OWJZ3DHPKMOMNWY4AY66FUR7ILBWANIHQN73QGJSNEHLSQOWKTMAYXZ4ASY6XJJ4IZG7DHMEVNRKFP7JT7LOKE7UQTOSJA5U3OBLOKCTNHIQ4MIEPK7VDFXXLWNTV7YMOD52U243Y7SB57ZD6IZQLRVGOF7XYYJW52QRFGZYPTXSF7GH3WNNSIH3QPQEMI7I', 5, 2016, print);



//lineGraphJSONObject(5, 2016, print);

*/







/*
var query = 'SELECT category_name FROM category';

var total_expenditure;
var cat_names = [];
var percent_cat = [];

/*function arrayOfCategories(){
	console.log("In the function");
	connection.query(query, [], function(err,result){
		if(err){
			console.log(err);
		}
		else{
			console.log("After query");
			for(var k in result){
				cat_names.push(result[k].category_name);
			}
		}
	});
}

function percents(){
	var month = 5;
	var year = 2016;  //default

	var query = 'SELECT category_name, SUM(amount) AS cat_expense FROM category, expenses WHERE expenses.category_id = category.category_id AND MONTH(expenses.date) = ? AND YEAR(expenses.date) = ? GROUP BY category_name';
	connection.query(query, [month, year], function(err,rows){
		if(err){
			console.log(err);
		}
		else{
			console.log("After query");
			for(var k in rows){
				if(rows[k].cat_expense>0){
					cat_names.push(rows[k].category_name);
					percent_cat.push(rows[k].cat_expense*100/total_expenditure);
				}
			}
			for(var k in percent_cat){
				console.log(cat_names[k]+' = '+percent_cat[k]);
			}
		}
	});
}



function totalExpense(){
	var month = 5;
	var year = 2016;  //default

	var total_expense = 'SELECT SUM(amount) FROM expenses WHERE MONTH(date) = ? AND YEAR(date) = ?';
	connection.query(total_expense, [month, year], function(error, total){
		if(error){
			console.log(error);
		}
		else{
			total_expenditure = (total[0]['SUM(amount)']);
		}
	});
}*/





//arrayOfCategories();
//totalExpense();
//percents();

//console.log("Ending Connection.");
//connection.end();




