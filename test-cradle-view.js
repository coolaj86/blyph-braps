/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true unused:true undef:true*/
(function () {
  "use strict";

  var cradle = require('cradle')
    , config = require('./config')
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
      .database(config.cradle.database, function () { console.log(arguments); })
    ;

  console.log('Warning: If the connection fails, it fails silently');

  db.view('schools/all', function (err, res) {
    res.forEach(function (row) {
      console.log(row);
    });
  });

}());
