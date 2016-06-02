/*
  * File Name : Server.js
  * Task : Run Server and fetch multiple emails from DB to send reminder
  * Invoke all the email task at once and update DB once the email is sent 
 */

/*
 * Load all the required modules 
*/

var async = require('async')
var nodemailer = require('nodemailer')
var mysql = require('mysql')
var dateUtils = require('./dateUtils')
var fs = require('fs')
var jade = require('pug')

var connection = mysql.createConnection({
  host: 'expensetrackerdb.cfogs9gj979r.us-east-1.rds.amazonaws.com',
  user: 'qb_internsgrp_1',
  password: 'qburst123',
  database: 'expensetrackerdb',
  debug: false,
  port: 3306
})

var success_email = []
// Will store email whose sending is failed. 
var failure_email = []

var transporter

var users = []

/* Loading modules done. */

function massMailer () {
  var self = this
  transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'handminiproject@gmail.com',
      pass: 'handminiprojectisinprogress'
    }
  })
  // Fetch all the emails from database and push it in listofemails
  // Will do it later.
  var query = 'SELECT user_id, email_id  FROM user '
  connection.query(query, [], function (err, rows) {
    if (err) {
      console.log(err)
    }else {
      users = rows
      self.invokeOperation()
    }
  })
}

/* Invoking email sending operation at once */

massMailer.prototype.invokeOperation = function () {
  var self = this
  async.each(users, self.SendEmail, function () {
    console.log(success_email)
    console.log(failure_email)
  })
}

/* 
* This function will be called by multiple instance.
* Each instance will contain one email ID
* After successfull email operation, it will be pushed in failed or success array.
*/

massMailer.prototype.SendEmail = function (user, callback) {
  console.log('Sending email to ' + user.email_id)
  var self = this
  self.status = false
  // waterfall will go one after another
  // So first email will be sent
  // Callback will jump us to next function
  // in that we will update DB
  // Once done that instance is done.
  // Once every instance is done final callback will be called.
  async.waterfall([
    function (callback) {
      var date = new Date()
      var pie = date.getMonth() + '-' + date.getFullYear() + '-pie-' + (user.user_id).slice(19) + '.png'
      var line = date.getMonth() + '-' + date.getFullYear() + '-line-' + (user.user_id).slice(19) + '.png'
      var bar = date.getMonth() + '-' + date.getFullYear() + '-bar-' + (user.user_id).slice(19) + '.png'
      var csv = date.getMonth() + '-' + date.getFullYear() + '-csv-' + (user.user_id).slice(19) + '.csv'
      fs.readFile(__dirname + '/public/charts/pie/' + pie, 'utf8', function (err, file) {
        if (err) {
          console.log('FILE NOT FOUND' + process.cwd() + '/charts/pie/' + pie)
        } else {
          fs.readFile(process.cwd() + '/views/index.jade', 'utf8', function (err, file) {
            if (err) {
              // handle errors
              console.log('ERROR!')
              return res.send('ERROR!')
            }else {
              imagesBaseURL = 'http://alexa-expense-tracker.herokuapp.com/charts/'
              // compile jade template into function
              var compiledTmpl = jade.compile(file, {filename: process.cwd() + '/views/index.jade'})
              // set context to be used in template
              var context = {pie: imagesBaseURL + 'pie/' + pie, line: imagesBaseURL + 'line/' + line, bar: imagesBaseURL + 'bar/' + bar}
              // get html back as a string with the context applied
              var html = compiledTmpl(context)
              console.log(html)
              var mailOptions = {
                from: '',
                to: user.email_id,
                subject: 'Expense Tracker : Monthly Expense Report For ' + dateUtils.getmonthNames(date.getMonth() - 1) + ', ' + date.getFullYear(),
                html: html,
                text: 'Dear User,\n\tThe following is your monthly expense report. The attached csv file contains each of your expenses in detail.',
                attachments: [
                  { // utf-8 string as an attachment
                    path: __dirname + '/public/csv/' + csv
                  }
                ]
              }
              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error)
                  failure_email.push(user.email_id)
                } else {
                  self.status = true
                  success_email.push(user.email_id)
                }
                callback(null, self.status, user.email_id)
              })
            }
          })
        }
      })
    },
    function (statusCode, Email, callback) {
      console.log('Will update DB here for ' + Email + 'With ' + statusCode)
      callback()
    }
  ], function () {
    // When everything is done return back to caller.
    callback()
  })
}
var sendMassmail = function () {
  var mailer = new massMailer()
}

exports.sendMail = sendMassmail
