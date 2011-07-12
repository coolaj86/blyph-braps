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

  // save the user info
  fs.readFile('users.json', function (err, data) {
    console.log('users.json', data.toString('utf8'));
    if (err) {
      console.error('ERR:', err);
      return;
    }

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
