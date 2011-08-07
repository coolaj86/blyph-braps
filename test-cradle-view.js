(function () {
  "use strict";

  var cradle = require('cradle')
    , config = require('./config')
    , fs = require('fs')
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
      /*{
          secure: true
        , auth: { username: 'coolaj86', password: 'Wh1t3Ch3dd3r' }
      }*/
      .database(config.cradle.database, function () { console.log(arguments); })
    ;

  console.log('Warning: If the connection fails, it fails silently');

  db.view('schools/all', function (err, res) {
    res.forEach(function (row) {
      console.log(row);
    });
  });

}());
