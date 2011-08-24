(function () {
  "use strict";

  var cradle = require('cradle')
    , db = new(cradle.Connection)('coolaj86.couchone.com', 443, {
          secure: true
        , auth: {
            username: 'coolaj86'
          , password: 'Wh1t3Ch3dd3r'
        }
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

            if (!info.isbn13) {
              return;
            }

            if (info.image) {
              if (info.image.match(/no_image\.gif$/)) {
                img = '';
              } else if (img = info.image.match(/ecx.images-amazon.com\/images\/I\/(.*?)\./)) {
                img = 'amz:' + img[1];
              }
            }

            // days since the blyph epoch is calculated as follows
            // 15190 - parseInt(new Date(doc.timestamp).valueOf() / (1000 * 60 * 60 * 24))
            // this is to conserve bytes
            emit(doc.school, [
                info.isbn13
              , 15190 - parseInt(new Date(doc.timestamp).valueOf() / (1000 * 60 * 60 * 24))
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
              , img
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
            if ('booklist' !== doc.type) {
              return;
            }

            emit(null, doc);
          }
        },
        byTrade: {
          map: function (doc) {
            var booklist
              , token = doc.token || doc.student || doc.email
              ;

            if ('booklist' !== doc.type) {
              return;
            }

            booklist = doc.booklist;

            Object.keys(doc.booklist).forEach(function (isbn) {
              // a few books creep in without ISBNs somehow
              // i.e. LDS SCRIPTURES (YOU ALREADY HAVE THEM)
              if (!(isbn||'').trim()) {
                return;
              }

              emit([isbn, doc.school], {
                  book: booklist[isbn]
                , token: token
              });
            });
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
            if ('user' !== doc.type) {
              return;
            }

            if (!doc.email) {
              return;
            }

            emit(null, doc);
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
