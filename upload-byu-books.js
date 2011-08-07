(function () {
  "use strict";

  require('Array.prototype.forEachAsync');

  var fs = require('fs')
    , config = require('../config.cradle.js')
    , cradle = require('cradle')
    , byuIsbns = JSON.parse(fs.readFileSync('./byu-isbns.json'))
    , bookinfoMap = JSON.parse(fs.readFileSync('./bookprices.json'))
    , count = 0
    , badCount = 0
    , db = new(cradle.Connection)(config.hostname, config.port, {
          secure: config.secure
        , auth: { username: config.username, password: config.password }
      }).database('syllabi', function () { console.log('connected to database', arguments); })
    ;

  function map(doc) {
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
    // 15190 - parseInt(new Date(doc.timestamp).valueOf() / (1000 * 60 * 60 * 24))
    // this is to conserve bytes
    //emit(doc.school, [
    return [
        info.isbn
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
      , info.image
    ];
    //]);
  }


  var jsonTable = [];

  //[byuIsbns[100]].forEachAsync(function (next, isbn) {
  byuIsbns.forEachAsync(function (next, isbn) {
    var bookinfo = bookinfoMap[isbn]
      , item
      ;

    if (!bookinfo) {
      badCount += 1;
      return next();
    }

    bookinfo.school = 'byu.edu';
    bookinfo.type = 'book';

    // don't send excess data
    delete bookinfo.offers;

    if (item = map(bookinfo)) {
      jsonTable.push(item);
      count += 1;
    } else {
      badCount += 1;
    }
    next();
    /*
    db.save(bookinfo.info.isbn13 + ':isbn', bookinfo, function (err, data) {
      if (err) {
        console.log(err);
        return next();
      }

      count += 1;
      console.log(count);
      next();
    });
    */
  }).then(function () {
    console.log(count, badCount);
    fs.writeFileSync('./bookinfo.table.json', JSON.stringify(jsonTable), 'utf8');
  });
}());
