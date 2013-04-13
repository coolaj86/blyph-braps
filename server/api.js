(function () {
  "use strict";

  // first match ever
  // August 24th, 2011
  // iClicker

  var config = require(__dirname + '/../config')
    , path = require('path')
    , connect = require('connect')
    , cradle = require('cradle')
    , blyphMatch = require('./match')
    , blyphSignUp = require('./signup')
    , account = require('./loginui/account')
    , handleSignUp = blyphSignUp.handleSignUp
    , handleUnsubscribe = blyphSignUp.handleUnsubscribe
    , emailMatchMessage = blyphMatch.emailMatchMessage
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
        .database(config.cradle.database, function () { console.log(arguments); })
    , userTokenRegExp = /^\w+$/
    ;

  blyphMatch.init(db);
  blyphSignUp.init(config, db);

  if (!connect.router) {
    connect.router = require('connect_router');
  }

  function merge(a, b) {
    Object.keys(b).forEach(function (key) {
      a[key] = b[key] || a[key];
    });
  }

  function getSchools(req, res) {
    db.view('schools/all', function (err, schools) {
      res.json(schools);
    });
  }

  function createRouteBySort(bySort) {
    /*jshint validthis:true*/
    var routes = this
      , cache = {}
      ;

    function getBooksBySort(req, res) {
      console.log("HERE I AM", req.params.isbn);
      function respond(err) {
        if (err) {
          console.error(__dirname);
          console.error(err);
        }
        console.log('responded');
        var result = cache[req.params.isbn];
        res.json({ books: result });
      }
      if (cache.timestamp >= new Date().valueOf() - 60 * 60 * 1000) {
        respond();
      } else {
        updateCache(respond);
      }
    }

    cache.timestamp = 0;

    function updateCache(cb) {
      console.log('asked for booklist');
      db.view('booklist/' + bySort, function (err, books) {
        console.log('got booklist');
        if (err) {
          return cb(err);
        }
        cache = {};
        books.forEach(function (value) {
          var book = value.book
            ;

          book.userToken = value.userToken;
          book.nickname = value.nickname || value.email && value.email.replace(/@.*/, '');

          if (book.isbn) {
            if (book.isbn === book.isbn13) {
              // nada
            } else if (book.isbn === book.isbn10) {
              // nada
            } else {
              cache[book.isbn] = cache[book.isbn] || [];
              cache[book.isbn].push(book);
            }
          } 

          if (book.isbn10) {
            cache[book.isbn10] = cache[book.isbn10] || [];
            cache[book.isbn10].push(book);
          }

          if (book.isbn13) {
            cache[book.isbn13] = cache[book.isbn13] || [];
            cache[book.isbn13].push(book);
          }
        });

        cache.timestamp = new Date().valueOf();
        cb();
      });
    }

    routes.get('/books/' + bySort + '/:isbn', getBooksBySort);
  }

  function getUserBooklist(req, res) {
    console.log('map booklist');
    var userToken = req.params.userToken.trim().toLowerCase()
      ;

    if (!userToken) {
      res.error(new Error("bad userToken"));
      res.json();
      return;
    }

    db.get(userToken + ':booklist', function (err, data) {
      if (data) {
        res.json(data);
      } else {
        res.json(err);
      }
    });
  }

  function matchMatch(req, res) {
    var message = req.body || {};

    if (
           userTokenRegExp.exec(message.to)
        && userTokenRegExp.exec(message.from)
        && 'string' === typeof message.bookTitle
        && 'string' === typeof message.body
    ) {
      message.to = message.to.trim().toLowerCase();
      message.from = message.from.trim().toLowerCase();
      emailMatchMessage(message, function (err) {
        if (err) {
          res.error(err);
        }
        console.log('message sent');
        res.json(message);
      });
      return;
    }

    res.error(new Error('some bad params'));
    res.json(req.body);
  }

  function setUserBooklist(req, res) {
    var booklist = req.body && req.body.booklist
      , redirect = req.body && req.body.redirect
      , result
      , error
      ;

    if (!req.params.userToken) {
      res.statusCode = 422;
      res.error(new Error('Bad userToken'));
      res.json();
      return;
    }

    if (!booklist) {
      res.statusCode = 422;
      res.error(new Error('no booklist found'));
      res.json();
      return;
    }

    try { 
      if ('string' === typeof booklist) {
        booklist = JSON.parse(booklist);
      } else if (!booklist || 'object' !== typeof booklist) {
        throw new Error('booklist neither proper JSON String nor Object');
      }
    } catch(e) {
      e.booklistText = booklist;
      e.message = e.toString();

      res.statusCode = 422;
      res.error(e);
      res.json();
      return;
    }

    if (!(booklist.userToken
      && 'booklist' === booklist.type 
      // TODO figure this crap out!
      //&& booklist.school 
      && booklist.timestamp 
      && 'object' === typeof booklist.booklist
      )) {

      res.statusCode = 422;
      result = {
          userToken: !!booklist.userToken
        , nickname: !!booklist.nickname
        , 'type': ('booklist' === booklist.type)
        , school: !!booklist.school 
        , timestamp: !!booklist.timestamp 
        , booklist: ('object' === typeof booklist.booklist)
      };
      error = new Error("Bad booklist object (userToken, type, school, timestamp, booklist)");
      error.debug = result;
      res.error(error);
      //res.meta('status', result);
      //res.json(result);
      res.json();
      return;
    }

    // TODO check if the book is in the isbn db
    // if it isn't, or the info is bad, update it

    function redirectBack(err, data) {
      if (err) {
        res.statusCode = 422;
        res.error(err);
        res.json();
        return;
      }

      if (!redirect) {
        res.json(data);
        return;
      }

      res.statusCode = 302;
      res.setHeader("Location", redirect);
      res.end(JSON.stringify(data));
    }

    function mergeLists(err, data) {
      if (err || 'object' !== data.booklist || Array.isArray(data.booklist)) { 
        data = { booklist: {} };
      }

      Object.keys(booklist.booklist).forEach(function (isbn) {
        var oldMaterial = data.booklist[isbn]
          , newMaterial = booklist.booklist[isbn]
          ;

        if (oldMaterial) {
          newMaterial = merge(oldMaterial, newMaterial);
        }
        data.booklist[isbn] = newMaterial;
      });

      //
      // copy over just the desired objects
      // TODO have a validate function
      //
      data.userToken = booklist.userToken;
      data.nickname = booklist.nickname;
      data.type = booklist.type;
      data.school = booklist.school;
      data.timestamp = booklist.timestamp;

      db.save(booklist.userToken + ':booklist', data, redirectBack);
    }

    db.get(booklist.userToken + ':booklist', mergeLists);
  }

  function addAccountToSession(session, account) {
    session.uuid = account.uuid;
    session.gravatar = account.gravatar;
    session.username = account.username;
    session.nickname = account.nickname || account.username || (account.email||'').replace(/@.*/, '');
    // The only valid use of secret as a property
    session.secret = 'otp' + account.otp;
    session.createdAt = account.createdAt;
    session.updatedAt = account.updatedAt;
    session.authenticatedAt = account.authenticatedAt;
    session.school = account.school;
  }

  account.init(path.join(__dirname, '..', 'var', 'users.db.json'), addAccountToSession);

  function rest(routes) {
    // TODO allow unsubscribe via email
    routes.post('/subscribe', handleSignUp);
    routes.put('/unsubscribe', handleUnsubscribe);

    routes.post('/sessions', account.restfullyAuthenticateSession);

    routes.post('/users', account.restfullyCreateUser);
    routes.get('/users/:id', account.checkOrGetUser);
    routes.patch('/users/:id', account.restfullyUpdateUser);

    // A list of all schools
    routes.get('/schools', getSchools);
    // TODO convert to use session
    routes.get('/booklist/:userToken', getUserBooklist);
    routes.post('/booklist/:userToken', setUserBooklist);
    // sorted and unsorted booklists
    [
        'byTrade'
      , 'byNeed'
      , 'byUnsorted'
      , 'byIgnore'
      , 'byKeep'
    ].forEach(createRouteBySort, routes);
    routes.post('/match', matchMatch);
  }

  module.exports = connect.router(rest);
}());
