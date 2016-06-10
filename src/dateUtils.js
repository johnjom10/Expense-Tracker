/**
 * Date utilities
 */

var dateUtils = (function() {
  'use strict';
  return {
    yyyymmdd: function(date) {
      var yyyy = date.getFullYear().toString();
      var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
      var dd = date.getDate().toString();
      return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]); // padding
    },
    yyyymmdddash: function(date) {
      var yyyy = date.getFullYear().toString();
      var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
      var dd = date.getDate().toString();
      return yyyy + (mm[1] ? mm : '0' + mm[0]) + (dd[1] ? dd : '0' + dd[0]); // padding
    },
    mm: function(date) {
      var mm = (date.getMonth() + 1).toString();
      mm = mm[1] ? mm : '0' + mm[0];
      return mm;
    },
    getmonthNames: function(index) {
      var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return monthNames[index];
    }
  };
})();

module.exports = dateUtils;