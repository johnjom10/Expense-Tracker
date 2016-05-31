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

function lineGraphObject(month, year, callback){  //returns array of objects in the form {date, Expenditure}
	var query = 'SELECT user_id, DAY(date) AS date, SUM(amount) AS Expenditure FROM expenses WHERE MONTH(date) = ? AND YEAR(date) = ? GROUP BY user_id, DAY(date)';
	connection.query(query, [month, year], function(err, expenses){
		if(err){
			console.log(err);
		}
		else{
			callback(expenses);
		}
	});
}

function jsonObject(arrayOfObjects, callback){
	var len = arrayOfObjects.length;
	var jsonObj = [];  								// the final json Object
	var userData = [];							    // to store the data of a single user
	for(var k = 0;k<len; k++){
		var data = {};								// store the date and the total expenditure for a day.
		data['date'] = arrayOfObjects[k].date;
		data['total'] = arrayOfObjects[k].Expenditure;
		userData.push(data);
		var flag = false;
		try{
			if(arrayOfObjects[k+1].user_id != arrayOfObjects[k].user_id){
				flag = true;
			}
			else{
			}
		}
		catch(ex){
			flag = true;
		}
		if(flag){
			var userObject = {};
			userObject['user_id'] = arrayOfObjects[k].user_id;
			userObject['user_data'] = userData;
			userData = [];
			jsonObj.push(userObject);
		}
	}
	callback(jsonObj);
}

function getJSONObject(month, year, callback){     // the driver function to be called.
	lineGraphObject(month, year, function(exp){
		jsonObject(exp, callback);
	});
}


/*
function print(arrayOfObjects){ 						 //test
	for(var k in arrayOfObjects){
		console.log(k+" : "+arrayOfObjects[k].user_id+": ");
		for(var j in arrayOfObjects[k]['user_data']){
			console.log(arrayOfObjects[k].user_data[j].date+" = "+arrayOfObjects[k].user_data[j].total);
		}
	}
}*/

//getJSONObject(5, 2016, print);  // test
