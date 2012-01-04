(function () {
  "use strict";

  var config = require(__dirname + '/../config')
    , forEachAsync = require('forEachAsync')
    , crypto = require('crypto')
    , cradle = require('cradle')
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
        .database(config.cradle.database, function () { console.log(arguments); })
    ;

  function moveNeedToHave(next, booklist) {
    var id = booklist._id || booklist.id
      , rev = booklist._rev || booklist.rev
      , changed = 0
      ;

    Object.keys(booklist.booklist).forEach(function (isbn) {
      var book = booklist.booklist[isbn]
        ;

      // Assume that everyone got the books they needed
      // and that they no longer need them
      if (book.wantIt) {
        book.wantIt = false;
        book.haveIt = true;
        changed += 1;
      }
    });

    console.log(id, changed, Object.keys(booklist.booklist).length);

    db.save(id, rev, booklist, function (err, res) {
      if (err) {
        console.error('missed one');
        console.error(id, rev, booklist);
        return;
      }
      next();
    });
  }

  db.view('booklist/all', function (err, data) {
    var list = []
      ;

    // this isn't really an array, it has a stupid magic
    // method that makes it act like one when you call forEach
    console.log('booklist/all', data.length);
    data.forEach(function (datum) {
      list.push(datum);
    });

    forEachAsync(list, moveNeedToHave);
  });
}());
