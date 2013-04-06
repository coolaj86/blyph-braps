(function () {
  "use strict";

  var config = require(__dirname + '/../config')
    , connect = require('connect')
    , cradle = require('cradle')
    , fs = require('fs')
    , blyphMail = require('./blyph-mail')
    , blyphMatch = require('./match')
    , BlyphUser = require('./user')
    , emailMatchMessage = blyphMatch.emailMatchMessage
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
        .database(config.cradle.database, function () { console.log(arguments); })
    , defaultWelcome
    , defaultSubject
    ;

  blyphMatch.init(db);

  if (!connect.router) {
    connect.router = require('connect_router');
  }

  defaultWelcome = fs.readFileSync(__dirname + '/../emails/welcome-2012-12-21.tpl.txt').toString('utf8');
  defaultSubject = "Welcome to Blyph";
  //"You can't beat personal contact, but you can explodinate asteroids";

  // August 24th, 2011
  // iClicker

  function merge(a, b) {
    Object.keys(b).forEach(function (key) {
      a[key] = b[key] || a[key];
    });
  }

  function sendEmail(user, fn) {
    var headers
      , referredBy
      , message
      ;

    referredBy = (user.referrerId || user.userToken.substr(14,8));

    message = defaultWelcome.replace(/\{\{REFERRED_BY\}\}/g, referredBy);

    headers = {
            from: "AJ @ Blyph <" + config.mailer.user + ">"
          , to: user.email
          , subject: defaultSubject
          , body: message
        }
        // message.attach_alternative("<html>i <i>hope</i> this works!</html>");
      ;

    blyphMail.send(config.mailer, headers, fn);
  }



  function rest(routes) {
    var userTokenRegExp = /^\w+$/
      ;

    // TODO allow unsubscribe via email
    routes.put('/unsubscribe', function (req, res) {
      var userToken = req.body && req.body.userToken;

      if (!userToken) {
        res.json({ error: { message: "no userToken given" } });
        return;
      }

      db.get(userToken, function (err, data) {
        if (!data || !data.doNotMail) {
          res.json({ error: { message: "No subscription found. Please email us if you wish to permanently delete your account" } });
          return;
        }

        data.doNotMail = true;
        db.save(data.userToken, data, function (err, data) {
          if (err) {
            console.error('db.save unsub', err);
          }
          res.json({userToken: data.userToken, couchdb: data});
        });
      });
      
    });

    routes.get('/schools', function (req, res) {
      db.view('schools/all', function (err, schools) {
        res.json(schools);
      });
    });
    // sorted and unsorted booklists
    ['byTrade', 'byNeed', 'byUnsorted', 'byIgnore', 'byKeep'].forEach(function (bySort) {
      var cache = {}
        ;

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

      routes.get('/books/' + bySort + '/:isbn', function (req, res) {
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
      });
    });

    /*
     *
     * Create and Retrieve Student Booklists
     *
     */
    // TODO convert to use session
    routes.get('/booklist/:userToken', function (req, res) {
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
    });

    routes.post('/match', function (req, res) {
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
    });

    routes.post('/booklist/:userToken', function (req, res) {
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
    });

    /*
    function random() {
      return 0.5 - Math.random();
    }
    */

    function handleSignUp(req, res) {
      var newUser = req.body
        ;

      function checkForExistingUser(err, fullUser) {
        function maybeSendConfirmationEmail(err, receipt) {
          if (err) {
            console.error('ERROR db.save 1st', err);
          } 

          fullUser._rev = receipt.rev;

          res.end(JSON.stringify({
              email: fullUser.email
            , userToken: fullUser.userToken
            , couchdb: fullUser
            , error: err
          }));

          if (fullUser.confirmationSent) {
            return;
          }

          sendEmail(fullUser, function(err/*, message*/) {
            if (err) {
              console.error('ERROR send email', err);
              return;
            }

            fullUser.confirmationSent += 1;
            db.save(fullUser.userToken, fullUser, function (err/*, receipt*/) {
              if (err) {
                console.error('ERROR db.save 1st confirmation', err);
              }
            });
          });

        }

        if (err && 'missing' !== err.reason) {
          console.error('db.get ERROR', err);
          //res.end(JSON.stringify(err));
        }

        if (!fullUser || !fullUser.email) {
          fullUser = {};
        }

        fullUser.type = 'user';
        fullUser.referredBy = fullUser.referredBy || newUser.referredBy;
        fullUser.referrerId = fullUser.userToken;
        fullUser.confirmationSent = fullUser.confirmationSent || 0;
        fullUser.email = fullUser.email || newUser.email;
        fullUser.userToken = fullUser.userToken || newUser.userToken;
        fullUser.school = fullUser.school || newUser.school;


        if (fullUser.confirmationSent) {
          res.end(JSON.stringify({
              email: fullUser.email
            , userToken: fullUser.userToken
            , couchdb: fullUser
            , error: err
          }));
          return;
        }

        db.save(fullUser.userToken, fullUser, maybeSendConfirmationEmail);
      }

      newUser = BlyphUser.create(newUser);
      if (newUser.errors.length) {
        res.statusCode = 422;
        res.error(new Error("bad object"));
        res.end();
        return;
      }

      res.writeHead(200, {'Content-Type': 'application/json'});


      db.get(newUser.userToken, checkForExistingUser);
    }

    routes.post('/subscribe', handleSignUp);
  }

  module.exports = connect.router(rest);
}());
