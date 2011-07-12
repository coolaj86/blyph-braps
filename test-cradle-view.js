(function () {
  "use strict";

  var cradle = require('cradle')
    , fs = require('fs')
    , db = new(cradle.Connection)('coolaj86.couchone.com', 443, {
          secure: true
        , auth: { username: 'coolaj86', password: 'Wh1t3Ch3dd3r' }
      }).database('syllabi', function () { console.log(arguments); })
    ;

  console.log('Warning: If the connection fails, it fails silently');

  db.view('schools/all', function (err, res) {
    res.forEach(function (row) {
      console.log(row);
    });
  });

}());
