(function () {
  "use strict";

  var config = require(__dirname + '/config')
    , cradle = require('cradle')
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
        .database(config.cradle.database, function () { console.log(arguments); })
    , pending = 2
    , forTrade = {}
    , users = {}
    , wanted = {}
    , providers = {}
    , consumers = {}
    ;

  function clone(obj) {
    JSON.parse(JSON.stringify(obj));
  }

    /*
    wanted =
      {
        "0123456789123": {
            "[0-9a-f]{32}": {
                isbn: "0123456789123"
              , userToken: "[0-9a-f]{32}"
            }
        }
      }
      
    consumers =
      {
        "[0-9a-f]{32}": {
            "0123456789123": {
                isbn: "0123456789123"
              , userToken: "[0-9a-f]{32}"
            }
        }
      }
    */

  function match() {
    var keys
      ;

    console.log('Number of providables: ' + (keys = Object.keys(forTrade)).length);
    //console.log(forTrade[keys[0]]);
    console.log('Number of consumables: ' + (keys = Object.keys(wanted)).length);
    //console.log(wanted[keys[0]]);
    console.log('Number of providers: ' + (keys = Object.keys(providers)).length);
    //console.log(providers[keys[0]]);
    console.log('Number of consumers: ' + (keys = Object.keys(consumers)).length);
    //console.log(consumers[keys[0]]);

    // For each person who needs something
    Object.keys(consumers).forEach(function (userToken) {
      var iConsume = consumers[userToken] || {}
        , iProvide = providers[userToken] || {}
        , myProviders = {}
        , myConsumers = {}
        , providerTokens
        , consumerTokens
        , mutualMatches = false
        , user = users[userToken]
        , other
        ;

      // Look at each thing that they need
      Object.keys(iConsume).forEach(function (isbn) {
        var book = iConsume[isbn]
          , someProviders = forTrade[isbn] || {}
          ;

        // Look at each person who has what they need
        // to
        Object.keys(someProviders).forEach(function (userToken2) {
          var theyConsume = consumers[userToken2] || {}
            , theyProvide = providers[userToken2] || {}
            ;

          myProviders[userToken2] = myProviders[userToken2] || {};
          myProviders[userToken2][book.isbn] = book;

          Object.keys(theyConsume).forEach(function (isbn2) {
            var book2
              ;

            if (!(book2 = iProvide[isbn2])) {
              return;
            }

            myConsumers[userToken2] = myConsumers[userToken2] || {};
            myConsumers[userToken2][book2.isbn] = book2;
          });

        });
      });

      providerTokens = Object.keys(myProviders);
      consumerTokens = Object.keys(myConsumers);

      if (!providerTokens.length && !consumerTokens.length) {
        return;
      }

      console.log('');
      console.log('');
      console.log('');

      console.log('Email for ' + userToken);

      providerTokens.forEach(function (userToken3) {
        var cons
          , prov
          ;

        if (!myConsumers[userToken3]) {
          return;
        }

        if (!mutualMatches) {
          console.log('Mutual exchanges:');
          mutualMatches = true;
        }

        prov = myProviders[userToken3];
        cons = myConsumers[userToken3];
        delete myProviders[userToken3];
        delete myConsumers[userToken3];

        other = users[userToken3];
        console.log('    with ' + other.email);
        console.log('      You need: ');
        Object.keys(prov).forEach(function (isbn) {
          var book = prov[isbn];
          console.log('      ', book.title);
          console.log('      ', book.isbn);
        });
        console.log('      ' + other.email.replace(/@.*/, '') + ' needs');
        Object.keys(cons).forEach(function (isbn) {
          var book = cons[isbn];
          console.log('      ', book.title);
          console.log('      ', book.isbn);
        });
      });

      providerTokens = Object.keys(myProviders);
      consumerTokens = Object.keys(myConsumers);

      console.log('');
      if (providerTokens.length) {
        console.log('These guys have what you need:');
      }
      providerTokens.forEach(function (token) {
        var provider = myProviders[token]
          , other = users[token]
          ;

        console.log('    with ', other.email);
        Object.keys(provider).forEach(function (isbn) {
          var book = provider[isbn];
          console.log('      ', book.title);
          console.log('      ', book.isbn);
        });
      });

      console.log('');
      if (consumerTokens.length) {
        console.log('These guys need what you have:');
      }
      consumerTokens.forEach(function (token) {
        var person = myProviders[token]
          , other = users[token]
          ;

        console.log('    with ', other.email);
        Object.keys(person).forEach(function (isbn) {
          var book = person[isbn];
          console.log('      ', book.title);
          console.log('      ', book.isbn);
        });
      });


      console.log('');


      // TODO give a list of all matches
      //console.log(iConsume);

    });

    /*
    Object.keys(forTrade).forEach(function (isbn) {
      var t = forTrade[isbn]
        , n = wanted[isbn]
        ;

      if (t && n) {
        tnMatches[isbn] = true;
        console.log('Miracle!', t, n);
      }
    });
    */

  }

  function forEachBook(data, byIsbn, byUserToken) {
    data.forEach(function (row) {
      var isbn = row.book.isbn13 || row.book.isbn || row.book.isbn10
        , token = row.userToken
        , people = byIsbn[isbn] = byIsbn[isbn] || {}
        , books = byUserToken[token] =  byUserToken[token] || {}
        , bookinfo
        , user = users[token]
        ;

      row.book.isbn = isbn;
      //bookinfo = clone(row.book)

      row.book.userToken = row.userToken;
      row.book.nickname = user.nickname || user.email.replace(/@.*/, '');

      people[token] = row.book;
      books[isbn] = row.book;
    });
  }


  db.view('users/all', function (err, data) {
    data.forEach(function (row) {
      users[row.userToken] = row;
    });

    console.log('Number of users:', Object.keys(users).length);

    db.view('booklist/byTrade', function (err, data) {
      forEachBook(data, forTrade, providers);

      pending -= 1;
      if (!pending) {
        match();
      }
    });

    db.view('booklist/byNeed', function (err, data) {
      forEachBook(data, wanted, consumers);

      pending -= 1;
      if (!pending) {
        match();
      }
    });
  });


}());
