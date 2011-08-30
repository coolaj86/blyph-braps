(function () {
  "use strict";

  var config = require(__dirname + '/config')
    , connect = require('jason')
    , mailer = require('emailjs')
    , mailserver = mailer.server.connect(config.emailjs)
    , cradle = require('cradle')
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
        .database(config.cradle.database, function () { console.log(arguments); })
    , server
    , vhost
    ;

  // August 24th, 2011
  // iClicker

  function emailMatchMessage(message, fn) {
    if (/^\$/.exec(message.fairPrice)) {
      message.fairPrice = message.fairPrice.substr(1);
    } else if (/\d/.exec(message.fairPrice)) {
      // nada
    } else {
      message.fairPrice = undefined;
    }
    var headers = {
            from: "AJ @ Blyph <" + config.emailjs.user + ">"
            // TODO sanatize / validate this carefully
          , to: message.to
          , cc: message.from
          , 'reply-to': message.from
          , subject: message.from.replace(/@.*/i, '') + " wants to exchange " + message.bookTitle
          , text: "" +
              "\n Who: " + message.from +
              "\n What: " + message.bookTitle +
              (Number(message.fairPrice) ? ("\n Our Fair Price Guesstimate: $" + message.fairPrice) : '') + 
              "\n Quoted Message:" +
              "\n" +
              "\n" + message.body +
              "\n" +
              "\n ===============" +
              "\n" +
              "\n" +
              "\nIf the above message contains offensive or otherwise inappropriate content please forward it directly to aj@blyph.com" +
              "\n" +
              "\nThanks for your support," +
              "\nAJ ONeal <aj@blyph.com> (http://fb.com/coolaj86)" +
              "\nBrian Turley <brian@blyph.com> (http://fb.com/brian.turley03)" +
              "\nLike us: http://fb.com/pages/Blyph/190889114300467" +
              "\nFollow us: http://twitter.com/blyph" +
              ""
        }
      , message = mailer.message.create(headers)
      ;

    mailserver.send(message, fn);
  }

  function sendEmail(user, fn) {
    var headers = {
            from: "AJ @ Blyph <" + config.emailjs.user + ">"
          , to: user.email
          , subject: "Share more Blyph, Get more Matches (and win an iPad)"
          , text: "" +
              "\nThanks for signing up. We're glad to have you." +
              "\n" +
              "\nWith only a few days before classes start, we really need your help to get the word out!" +
              "\n" +
              "\nWhy? Simple: More people means more trading matches." +
              "\n" +
              "\nPlease share this unique link with your BYU friends:" +
              "\nhttp://blyph.com#/?referredBy=" + user.referrerId +
              "\n" +
              "\nAs a bonus, the more friends you share with, the more entries you get into the 16gb iPad2 drawing." +
              "\n" +
              "\n10 friends join - 10 entries" +
              "\n20 friends join - 40 entries" +
              "\n30 friends join - 90 entries" +
              "\n10n friends join - 10(n^2) entries (for you math geeks)" +
              "\n100 friends join - 1000 entries" +
              "\n" +
              "\n" +
              "\nThanks for your support," +
              "\nAJ ONeal <aj@blyph.com> (http://fb.com/coolaj86)" +
              "\nBrian Turley <brian@blyph.com> (http://fb.com/brian.turley03)" +
              "\nLike us: http://fb.com/pages/Blyph/190889114300467" +
              "\nFollow us: http://twitter.com/blyph" +
              "\n" +
              "\n* Drawing details at http://blyph.com/sweepstakes-rules.html" +
              ""
        }
        // message.attach_alternative("<html>i <i>hope</i> this works!</html>");
      , message = mailer.message.create(headers)
      ;

    mailserver.send(message, fn);
  }

  function log(err, data) {
    console.error('err: ' + err);
    console.log('data: ' + JSON.stringify(data));
  }

  function rest(app) {
    // TODO allow unsubscribe via email
    app.put('/unsubscribe', function (req, res) {
      var email = req.body && req.body.email;

      if (!email) {
        res.json({ error: { message: "no email given" } });
        return;
      }

      db.get(email, function (err, data) {
        if (!data || !data.doNotMail) {
          res.json({ error: { message: "No subscription found. Please email us if you wish to permanently delete your account" } });
          return;
        }

        data.doNotMail = true;
        db.save(data.email, data, function (err, data) {
          if (err) {
            console.error('db.save unsub', err);
          }
          res.json({email: data.email, couchdb: data});
        });
      });
      
    });

    // sorted and unsorted booklists
    ['byTrade', 'byNeed', 'byUnsorted', 'byIgnore', 'byKeep'].forEach(function (bySort) {
      var cache = {}
        , inProgress = false
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

            book.token = value.token;

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

      app.get('/books/' + bySort + '/:isbn', function (req, res) {
        console.log("HERE I AM", req.params.isbn);
        function respond(err) {
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
    app.get('/schools', function (req, res) {
      db.view('schools/all', function (err, schools) {
        res.json(schools);
      });
    });

    /*
     *
     * Create and Retrieve Student Booklists
     *
     */
    // TODO convert to use session
    app.get('/booklist/:email', function (req, res) {
      console.log('map booklist');
      var email = req.params.email
        ;

      if (!email) {
        res.json({ error: { message: "bad token" } });
        return;
      }

      email.toLowerCase();
      db.get(email + ':booklist', function (err, data) {
        if (data) {
          res.json(data);
        } else {
          res.json(err);
        }
      });
    });

    app.post('/match', function (req, res) {
      var message = req.body || {};

      if (
             emailRegExp.exec(message.to)
          && emailRegExp.exec(message.from)
          && 'string' === typeof message.bookTitle
          && 'string' === typeof message.body
      ) {
        emailMatchMessage(message, function (err) {
          if (err) {
            res.error(err);
          }
          res.json(message);
        });
        return;
      }

      res.error(new Error('some bad params'));
      res.json(req.body);
    });
    // todo One-Time Tokens
    // todo token in params
    app.post('/booklist/:token', function (req, res) {
      var booklist = req.body && req.body.booklist
        , redirect = req.body && req.body.redirect
        ;

      try { 
        booklist = JSON.parse(booklist);
      } catch(e) {
        res.writeHead(422);
        res.end(JSON.stringify({ error: { message: "Bad body", booklistText: booklist, parseError: JSON.stringify(e)} }));
        return;
      }

      if (!booklist) {
        res.writeHead(422);
        res.end(JSON.stringify({ error: { message: "Bad body", parseError: JSON.stringify(e)} }));
        return;
      }

      if (!req.params.token) {
        res.writeHead(422);
        res.end(JSON.stringify({ error: { message: "Bad token"} }));
        return;
      }

      // TODO token should cause lookup for email?
      if (!(booklist.token
        && 'booklist' === booklist.type 
        // TODO figure this crap out!
        //&& booklist.school 
        && booklist.timestamp 
        && 'object' === typeof booklist.booklist
        )) {
        res.writeHead(422);
        var status =
        {
            token: !!booklist.token
          , 'type': !!('booklist' === booklist.type)
          , school: !!booklist.school 
          , timestamp: !!booklist.timestamp 
          , booklist: !!('object' === typeof booklist.booklist)
        };
        res.end(JSON.stringify({ error: { message: "Bad booklist object (token, type, school, timestamp, booklist)"}, status: status }));
        return;
      }

      // TODO check if the book is in the isbn db
      // if it isn't, or the info is bad, update it

      function redirectBack(err, data) {
        if (err) {
          res.writeHead(422);
          res.error(err);
          res.json();
          return;
        }

        if (!redirect) {
          res.json(data);
          return;
        }

        res.setHeader("Location", redirect);
        res.statusCode = 302;
        res.end(JSON.stringify(data));
      }

      function merge(a, b) {
        Object.keys(b).forEach(function (key) {
          a[key] = b[key] || a[key];
        });
      }

      function mergeLists(err, data) {
        var isbns = {};

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
        data.token = booklist.token;
        data.type = booklist.type;
        data.school = booklist.school;
        data.timestamp = booklist.timestamp;
        data.student = booklist.student;

        db.save(booklist.student + ':booklist', data, redirectBack);
      }

      db.get(booklist.student + ':booklist', mergeLists);
    });

    function random() {
      return 0.5 - Math.random();
    }

    // RFC Allowed: ! # $ % & ' * + - / = ? ^ _ ` { | } ~
    // Hotmail Disallowed ! # $ % * / ? ^ ` { | } ~
    // (I agree with MS on this one!)
    var emailRegExp = /^[-&'+=_\w\.]+@[-\w\.]+\.\w{1,8}$/i;
    var schoolRegExp = /^(?:https?:\/\/)?(?:[-\w\.]+\.)?([-\w]+\.(?:edu|gov))$/i;
    // "http://www.byu.edu"
    // "http://www-apps.byu.edu"
    // "http://www-apps.byu-i.edu"
    // "byu.edu"

    function BlyphUser(obj) {
      this.errors = [];

      this.type = 'user';

      if (!obj) {
        this.errors.push("empty user");
        return;
      }

      if ('string' !== typeof obj.email || !emailRegExp.exec(obj.email.trim())) {
        this.errors.push("bad email address");
        return;
      }
      // TODO remove extraneous '.' and trailing '+xyz' for 
      //if (email.match(/@gmail\./) || email.match(/@googlemail\./)) {
      //}
      this.email = obj.email.trim().toLowerCase();

      if ('string' !== typeof obj.school || !schoolRegExp.exec(obj.school.trim())) {
        this.errors.push("bad school address");
        return;
      }
      this.school = obj.school.trim().toLowerCase();

    }
    // t: coolaj86@gmail.com
    // t: coolaj.86+wow_z-ers@google.mail.com
    // f: coolaj86@gmail
    // f: coolaj86@gmail.
    // f: @gmail.com

    var blyphSecret = 'thequickgreenlizard';
    var token = (blyphSecret + 'abcdefghijklmnopqrstuvwxyz0123456789');

    function handleSignUp(req, res) {
      var email = req.body && req.body.email
        , newUser = req.body
        ;

      newUser = new BlyphUser(newUser);
      if (newUser.errors.length) {
        res.statusCode = 422;
        res.end('{ "error": { "message": "bad object" } }');
        return;
      }

      res.writeHead(200, {'Content-Type': 'application/json'});

      // same chars, but mixed up every time
      token = token.split('').sort(random).join('');

      // 
      db.get(newUser.email, function (err, fullUser) {
        if (err && 'missing' !== err.reason) {
          console.error('db.get ERROR', err);
          //res.end(JSON.stringify(err));
        }

        if (!fullUser || !fullUser.email) {
          fullUser = {};
        }

        fullUser.type = 'user';
        fullUser.referredBy = fullUser.referredBy || newUser.referredBy;
        fullUser.referrerId = fullUser.referrerId || token.substr(0, 8);
        fullUser.confirmationSent = fullUser.confirmationSent || 0;
        fullUser.email = fullUser.email || newUser.email;
        fullUser.school = fullUser.school || newUser.school;


        if (fullUser.confirmationSent) {
          /*
          sendEmailCheck(fullUser, function (err, message) {
            if (err) {
              console.error('ERROR eager mail', err);
              return;
            }

            fullUser.confirmationSent += 1;
            db.save(fullUser.email, fullUser, function (err, receipt) {
              if (err) {
                console.error('ERROR db.save 2nd+ confirmation', err);
              }
            });
          });
          */

          res.end(JSON.stringify({
              email: email
            , couchdb: fullUser
            , error: err
          }));
          return;
        }

        db.save(fullUser.email, fullUser, function (err, receipt) {
          if (err) {
            console.error('ERROR db.save 1st', err);
          } 
          fullUser._rev = receipt.rev;

          res.end(JSON.stringify({
              email: email
            , couchdb: fullUser
            , error: err
          }));

          sendEmail(fullUser, function(err, message) {
            if (err) {
              console.error('ERROR send email', err);
              return;
            }

            fullUser.confirmationSent += 1;
            db.save(fullUser.email, fullUser, function (err, receipt) {
              if (err) {
                console.error('ERROR db.save 1st confirmation', err);
              }
            });
          });

        });
      });
    }

    app.get('/subscribe/:user@:domain.:tld', function(req, res) {
      req.body = req.params;

      handleSignUp(req, res);
    });

    app.post('/subscribe', handleSignUp);
  };

  function cors(req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
      //doop(next);
      if (req.method.match(/options/i)) {
        res.end();
        return;
      }
      if (next) {
          next();
      }
  }

  function booklistscraper(req, res, next) {
    //console.log(req);
    next();
    /*
    if (!req.url.match(/^\/booklistscraper/)) {
      next();
      return;
    }

    cors(req, res, function () {
      if (!req.method.match(/POST/i)) {
        return next();
      }
      console.log('cross-origin request', req.body);
      res.end('oh happy dagger');
    });
    */
  }

  server = connect.createServer(
      connect.favicon(__dirname + '/public/favicon.ico')

  // these won't work CORS-style without an Access-Control-Allow
  //, connect.cookieParser()
  //, connect.session({ secret: 'Baby, ride your Firebolt!' })

    // decode http forms
    , connect.bodyParser()

    // cors uploads
    //, booklistscraper

    // images, css, etc
    , connect.static(__dirname + '/public')


    // REST API
    , connect.router(rest)
  );

  // TODO move up and out
  vhost = connect.createServer(
      connect.vhost(config.vhost, server)
    , connect.vhost('www.' + config.vhost, connect.createServer(function (req, res, next) {
        // TODO fix nowww module
        var hostname = 'blyph.com'
          , host = req.headers.host.replace(/^www\./, '')
          , href = 'http://' + host + req.url
          ;

        res.statusCode = 302;
        // TODO how to determine http vs https?
        res.setHeader('Location', href);
        // TODO set token to notify browser to notify user about www
        res.write(
            'Quit with the www already!!! It\'s not 1990 anymore!'
          + '<br/>'
          + '<a href="' + href + '">' + hostname + '</a>'
          + '<br/>NOT www.' + hostname
          + '<br/>NOT http://' + hostname
          + '<br/>just <a href="http://' + hostname + '">' + hostname + '</a> !!!'
          + '<br/>'
          + ';-P'
        );
        res.end();
      }))
  );

  module.exports = vhost;
}());
