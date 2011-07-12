(function () {
  "use strict";

  var cradle = require('cradle')
    , db = new(cradle.Connection)('coolaj86.couchone.com', 443, {
          secure: true
        , auth: { username: 'coolaj86', password: 'Wh1t3Ch3dd3r' }
      }).database('syllabi', function () { console.log('connected to database', arguments); })
    ;

  /*
    {
      school: "byu",
      schoolname: "Brigham Young University",
      email: "coolaj86@gmail.com",
      username: "coolaj86"
    }
  */
  db.save("_design/schools",
    {
      views: {
        all: {
          map: function (doc) {
            if (!doc.school || doc.email) {
              return;
            }

            emit(doc.school, doc);
          }
        }
      }
    }
  );

  db.save("_design/users",
    {
      views: {
        all: {
          map: function (doc) {
            if (!doc.email) {
              return;
            }

            emit(doc.email, doc);
          }
        },
        bySchool: {
          map: function (doc) {
            if (!doc.email) {
              return;
            }

            if (!doc.school) {
              doc.school = null;
            }

            emit(doc.school, doc.email);
          }
          /*
          ,
          reduce: function (school, users) {
            var i;

            if (!Array.isArray(values[0])) {
              values[0] = [values];
            }

            for (i = 1; i < values.length; i += 1) {
              values[0].push(values[i]);
            }

            return values;
          }
          */
        }
      }
    }
  );
}());
