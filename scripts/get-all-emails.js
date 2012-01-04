(function () {
  "use strict";

  var config = require(__dirname + '/../config')
    , cradle = require('cradle')
    , db = new (cradle.Connection)(
          config.cradle.hostname
        , config.cradle.port
        , config.cradle.options
      )
        .database(config.cradle.database, function () {
          console.log(arguments);
        })
    ;

  db.view('users/all', function (err, data) {
    var users = []
      ;

    data.forEach(function (row) {
      if ('byu.edu' !== row.school) {
        return;
      }
      console.log(row.email + ',');
      users.push(row);
    });
    return;
  });

}());
