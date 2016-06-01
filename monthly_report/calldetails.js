









var mysql = require('mysql')
var percent = [];


var connection = mysql.createConnection({
  host: 'expensetrackerdb.cfogs9gj979r.us-east-1.rds.amazonaws.com',
  user: 'qb_internsgrp_1',
  password: 'qburst123',
  database: 'expensetrackerdb',
 // debug: true,
  port: 3306
})




var getPercentDetails  = function(){


var use = {
  userId : "",
  data : [],  
  total : 0,
}


var data = {};

    var date = new Date();
    var mm = (date.getMonth() + 1).toString()
        mm = mm[1] ? mm : '0' + mm[0]
        var total = 0;
        var count = -1;        // 
        var countset = -1;     //
        var dummy = 0;
        var limit = 0;
        var user ='0';
        var users = [];

        var query = 'SELECT user_id ,category_name,sum(amount) as total  FROM expenses,category WHERE month(date) = ? and year(date) = ? and (expenses.category_id = category.category_id) group by user_id,category_name' ;
        connection.query(query, [mm, date.getFullYear()], function (err, rows) { 
          if(err)
            console.log(err);
          else {
            if (rows.length === 0) {

            } else {  
              for(var i = 0; i < rows.length ; i++){


                if(user != rows[i]['user_id']){
                  if(count != countset)
                  { 
                    users[limit++] = use
                    count--
                  
                    
                  }
                  use.userId = rows[i]['user_id']
                  user = rows[i]['user_id']
                  use.total = 0
                  count++
                } 

                if(rows[i]['total'] > 0){
                  data.percentage = rows[i]['total']
                  data.category = rows[i]['category_name']
                  use.total += rows[i]['total']
                  use.data.push(data)
                  console.log(use.data)
                  
                 }
             }
             //console.log(users)
             for( var i = 0 ; i < users.length ; i++){
              if(users[i].total != 0) { //console.log(users[i].data.length,i)
                for(var j = 0 ; j < users[i].data.length ; j++){
                  
                  users[i].data[j].percentage = (users[i].data[j].percentage * 100)/users[i].total
                 
                  } 
                }    
              }

                
               for(var i = 0 ; i < users.length ; i++) 
              {
                console.log( users[i]);
              }
               connection.end();
             }
              }
         })
     }

  


  var getTotalExpense = function(userId){
  

    var date = new Date();
    var mm = (date.getMonth() + 1).toString()
        mm = mm[1] ? mm : '0' + mm[0]
        var total = 0;
        var dummy = [];
        var query = 'SELECT SUM(amount) as Total ,category_name as category FROM expenses,category WHERE ( ( expenses.category_id = category.category_id ) AND month(date) = ? AND year(date) = ? AND user_id = ?) GROUP BY category_name order by Total DESC' ;
        connection.query(query, [mm, date.getFullYear(), userId], function (err, rows) { 
          if(err)
            console.log(err);
          else {   console.log("Inside")
            if (rows.length === 0) {

            } else { 
                 for(var i = 0 ; i < rows.length; i++){
                      if(rows[i]['Total'] > 0 ){
                       total = total + rows[i]['Total']
                         dummy.push(rows[i])
                     }
                 }
               console.log(total)
              if(total <= 0 )  
              dummy = []       //if total is zero percentage is undefined
           console.log(dummy)
           connection.end();
           return dummy  
              }
         }
     })

  }




//getTotalExpense("amzn1.ask.account.AFP3ZWPOS2BGJR7OWJZ3DHPKMOMNWY4AY66FUR7ILBWANIHQN73QHZVLNGUCA3BZJL4MPPURTMEY4IORKKI5VKVITM43IFEC6UQDY4ZDCKN7QFCSVHO7CR2WUGGHS2OYLQSYYTKTTCOD6E56Y7IRIOGPK4UMPYNKD7GTS5RUHOBDIGZTSQJTZG3GZIFBG2JNOBXPDQX3L4M5DSY")
 getPercentDetails ()


