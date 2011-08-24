(function () {
  "use strict";

  var config = require(__dirname + '/config')
    , cradle = require('cradle')
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
        .database(config.cradle.database, function () { console.log(arguments); })
    , pending = 2
    , trade
    , need
    ;

  function match() {
    var books = {};

    Object.keys(trade).forEach(function (isbn) {
      var a = trade[isbn]
        , b = need[isbn]
        ;

      if (a && b) {
        console.log('Miracle!', a, b);
      }
    });


    Object.keys(books).forEach(function (isbn) {
      var matches = books[isbn]
        ;

      if (matches.length > 1) {
        console.log('matches: ', matches);
      }
    });
  }

  db.view('booklist/byTrade', function (err, data) {
    var books = {};

    data.forEach(function (row) {
      var isbn = row.book.isbn
        , matches = books[isbn] = books[isbn] || []
        ;

      row.book.token = row.token;
      matches.push(row.book);
    });

    trade = books;

    pending -= 1;
    if (!pending) {
      match();
    }
  });

  db.view('booklist/byNeed', function (err, data) {
    var books = {};

    data.forEach(function (row) {
      var isbn = row.book.isbn
        , matches = books[isbn] = books[isbn] || []
        ;

      row.book.token = row.token;
      matches.push(row.book);
    });

    need = books;

    pending -= 1;
    if (!pending) {
      match();
    }
  });


}());
