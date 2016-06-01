


var mysql = require('mysql');
var json2csv = require('json2csv');
var fs = require('fs');

var connection = mysql.createConnection({
    host     : 'expensetrackerdb.cfogs9gj979r.us-east-1.rds.amazonaws.com',
    user     : 'qb_internsgrp_1',
    password : 'qburst123',
    database : 'expensetrackerdb',
    debug    : false,
    port     : 3306
});



var csv = (function(){

return{

	//  fetching data from DB and Passing it 

	getData : function(callback){  //returns array of objects in the form {date, Expenditure}
		var query = 'SELECT user_id, day(date) as day,amount,category_name as category FROM expenses,category WHERE MONTH(date) = ? AND YEAR(date) = ? AND expenses.category_id = category.category_id GROUP BY user_id, date,category  ';
		var date = new Date();                                                   // to get month and and year corresponding to previous year 
		var mm;
		var year;
		if(date.getMonth() == 0 ){               
	 	mm = "12" ; 
	 	year = (date.getFullYear()-1).toString();
		}else{
		mm = (date.getMonth()).toString();
		mm = mm[1] ? mm : '0' + mm[0];
		}
		connection.query(query, [mm, date.getFullYear()], function(err,rows){
			if(err){
				console.log(err);
			}
			else{
				
				
				callback(rows);
			}
			connection.end();
		});
	},


    // conversion of data fetched from DB to required format 

	arrangeCSV : function(dataArray){                                                   
		var len = dataArray.length; 								
		var userData = [];
		var splits ;
		var filename = "";
		var fields = ['date', 'amount','category'];

								   
		for(var k = 0;k<len; k++){
			var data = {};								
			data['date'] = dataArray[k].day+"-"+mm+"-"+date.getFullYear();
			data['amount'] = dataArray[k].amount;
			data['category'] = dataArray[k].category;
			userData.push(data);
			var flag = false;
			try{
				if(dataArray[k+1].user_id != dataArray[k].user_id){
					flag = true;
				}
				else{
				}
			}
			catch(ex){
				flag = true;
			}
			if(flag){
				splits = dataArray[k].user_id.split(".",4);
				filename = "CSV/"+mm+date.getFullYear()+splits[3];
	            
	            json2csv({ data: userData , fields: fields }, function(err, csv) {    // for the conversion of JSON data to CSV file 
	  			if (err) console.log(err);
	  			fs.writeFile(filename, csv, function(err) {
	    		if (err) throw err;
	    		console.log("File Saved");
	  		     });
			    });

				userData = [];
				
				
			}
		}

		
	},

	// the driver function to be called.

	csvGeneration : function(){     
		csv.getData(function(data){
		csv.arrangeCSV(data);
		
		});
	}

}

})();

module.exports = csv   
