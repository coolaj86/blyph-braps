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
            if (doc.type && 'school' !== doc.type) {
              return;
            }

            if (!doc.school || doc.email) {
              return;
            }

            emit(doc.school, doc);
          }
        }
      }
    }
  );

  // bookinfo:schema
  db.save("_design/bookinfo",
    {
      views: {
        all: {
          map: function (doc) {
            var info
              , img
              ;

            if ('book' !== doc.type) {
              return;
            }

            info = doc.info;
            info.isbn = info.isbn13 || info.isbn10;

            if (!info.isbn) {
              return;
            }

            if (info.image) {
              if (info.image.match(/no_image\.gif$/)) {
                info.image = '';
              } else if (img = info.image.match(/ecx.images-amazon.com\/images\/I\/(.*?)\./)) {
                info.image = 'amz:' + img[1];
              }
            }

            // days since the blyph epoch is calculated as follows
            // 15190 - parseInt(new Date(info.timestamp).valueOf() / (1000 * 60 * 60 * 24))
            // this is to conserve bytes
            emit(doc.school, [
                info.isbn
              , 15190 - parseInt(new Date(info.timestamp).valueOf() / (1000 * 60 * 60 * 24))
              , info.title
              , info.author
              , info.binding
              , info.msrp
            //, info.pages
              , info.publisher
              , info.published_date
              , info.edition
            //, info.rank
            //, info.rating
              , info.image
            ]);
          }
        }
      }
    }
  );

  db.save("_design/booklist",
    {
      views: {
        all: {
          map: function (doc) {
            var id = doc.email || doc.student || doc.token;

            if ('booklist' !== doc.type) {
              return;
            }

            delete doc.type;
            emic([id, doc.term], doc);
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
            if (doc.type && 'user' !== doc.type) {
              return;
            }

            if (!doc.email) {
              return;
            }

            emit(doc.email, doc);
          }
        },
        bySchool: {
          map: function (doc) {
            if (doc.type && 'user' !== doc.type) {
              return;
            }

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
