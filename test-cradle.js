(function () {
  "use strict";

  var cradle = require('cradle')
    , db = new(cradle.Connection)('coolaj86.couchone.com', 443, {
          secure: true
        , auth: { username: 'coolaj86', password: 'Wh1t3Ch3dd3r' }
      }).database('syllabi', function () { console.log(arguments); })
    , email = 'coolaj86@gmail.com'
    ;

  console.log('Warning: If the connection fails, it fails silently');

  db.save(email, {email: email, timestamp: new Date().toString() }, function (err, data) {
    console.log('works');
    if (err) {
      console.error(err);
      return;
    }
    db.get(email, function (err, data) {
      console.log('works again');
      if (err) {
        console.error(err);
        return;
      }
      console.log({ email: email, couchdb: data });
    });
  });


}());
