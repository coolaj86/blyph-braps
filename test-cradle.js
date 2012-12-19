/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true unused:true undef:true*/
(function () {
  "use strict";

  var cradle = require('cradle')
    , fs = require('fs')
    , config = require('./config')
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
      .database(config.cradle.database, function () { console.log(arguments); })
    ;

  console.log('Warning: If the connection fails, it fails silently');

  // save the user info
  fs.readFile('users.json', function (err, data) {
    if (err) {
      console.error('ERR:', err);
      return;
    }
    console.log('users.json', data.toString('utf8'));

    data = JSON.parse(data.toString('utf8'));

    data.forEach(function (user) {
      console.log('user:', user);
      user.timestamp = new Date().toString();
      db.save(user.email, user, function (err, data) {
        /*
        db.get(email, function (err, data) {
          console.log('works again');
          if (err) {
            console.error(err);
            return;
          }
          console.log({ email: email, couchdb: data });
        });
        */
        console.log('err:', err, 'data:', data);
      });
    });
  });


  // save the school info
  fs.readFile('schools.json', 'utf8', function (err, data) {
    console.log('schools.json', data.toString('utf8'));
    if (err) {
      console.error('ERR:', err);
      return;
    }

    data = JSON.parse(data.toString('utf8'));

    Object.keys(data).forEach(function (school) {
      var schoolname = data[school];
      
      db.save(school, {
          school: school
        , schoolname: schoolname
        , timestamp: new Date().toString()
      }, function (err, data) {
        console.log('err:', err, 'data:', data);
      });

    });
    console.log(data);
  });


}());
