(function () {
  "use strict";

  var config = require(__dirname + '/config')
    , connect = require('connect')
    , CORS = require('connect-xcors')
    , queryParser = require('connect-queryparser')
    , mailer = require('emailjs')
    , corsJsonSession = require(__dirname + '/routes/cors-json-session')
    , mailserver = mailer.server.connect(config.emailjs)
    , cradle = require('cradle')
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
        .database(config.cradle.database, function () { console.log(arguments); })
    , server
    , vhost
    ;

  function handleSchool(school) {
    // TODO all of these should pass
    // "http://www.byu.edu"
    // "http://www-apps.byu.edu"
    // "http://www-apps.byu-i.edu"
    // "byu.edu"
    school = school || '';
    school = school.trim().toLowerCase();
    school = school.match(/.*\b([-\w]+\.\w+)/);
    if (school) {
      school = school[1];
    }
    return school;
  }

  function handleEmail(email) {
    email = email.trim().toLowerCase();
    /*
    // TODO remove extraneous '.' and trailing '+xyz' for 
    if (email.match(/@gmail\./) || email.match(/@googlemail\./)) {
    }
    */
    return email;
  }

  // TODO share the link
  function sendEmailCheck(user, fn) {
    var headers = {
            from: "AJ ONeal <" + config.emailjs.user + ">"
          , to: user.email
          , subject: "We heard you the first time! =^P"
          , text: "\nHey,\n" +
              "\nThose monkeys just aren't fast enough are they?" + 
              "\nWe got your registration the first time, but you're on our 'A' list for being extra eager." + 
              "\n" +
              "\nNow take that eagerness and share away!" +
              "\nhttp://blyph.com#/?referredBy=" + user.referrerId + 
              "\n" +
              "\n=8^D\n" +
              "\n" +
              "\nThanks for your support," +
              "\nAJ @coolaj86 & Brian @Brian_Turley" +
              "\nLike us: http://facebook.com/pages/Blyph/190889114300467" +
              "\nTweet us: http://twitter.com/blyph" + 
              "\n" +
              "\nP.S. Our monkeys are treated in accordance with the Animal Welfare Act of 1966, " +
              "including fair wages, hours, and are not subject to animal (or human) testing."
        }
        // message.attach_alternative("<html>i <i>hope</i> this works!</html>");
      , message = mailer.message.create(headers)
      ;

    mailserver.send(message, fn);
  }
  function sendEmail(user, fn) {
    var headers = {
            from: "AJ @ Blyph <" + config.emailjs.user + ">"
          , to: user.email
          , subject: "Thanks for signing up with Blyph"
          , text: "Our monkeys are hard at work building Blyph.com." + 
              "\n" +
              "\nWe'll let you know as soon as it's ready!" + 
              "\n" +
              // TODO your-school-here
              "\nIn the meantime, please share your unique link with your BYU and UVU friends:" +
              "\nhttp://blyph.com#/?referredBy=" + user.referrerId + 
              "\n" +
              "\nNot only does sharing mean you're more likely to get trading matches," +
              "\nbut the more friends you share with, the more entries you get into the $350 reimbursement drawing." +
              "\n" +
              "\n10 friends join - 10 entries" +
              "\n20 friends join - 40 entries" +
              "\n30 friends join - 90 entries" +
              "\n10n friends join - 10(n^2) entries (for you math geeks)" +
              "\n100 friends join - 1000 entries" +
              "\n" +
              "\n" +
              "\nThanks for your support," +
              "\nAJ ONeal <aj@blyph.com> & Brian Turley <brian@blyph.com>" +
              "\nLike us: http://facebook.com/pages/Blyph/190889114300467" +
              "\nTweet us: http://twitter.com/blyph" + 
              "\n" +
              "\nP.S. Our monkeys are treated in accordance with the Animal Welfare Act of 1966, " +
              "including fair wages, hours, and are not subject to animal (or human) testing." +
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
        res.end(JSON.stringify({ error: { message: "no email given" } }));
        return;
      }

      db.get(email, function (err, data) {
        if (!data || !data.doNotMail) {
          res.end(JSON.stringify({ error: { message: "No subscription found. Please email us if you wish to permanently delete your account" } }));
          return;
        }

        data.doNotMail = true;
        db.save(data.email, data, function (err, data) {
          if (err) {
            console.error('db.save unsub', err);
          }
          res.end(JSON.stringify({email: data.email, couchdb: data}));
        });
      });
      
    });

    app.get('/schools', function (req, res) {
      db.view('schools/all', function (err, schools) {
        res.end(JSON.stringify(schools));
      });
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

      if (!((booklist.student || booklist.token)
        && 'booklist' === booklist.type 
        && booklist.school 
        && booklist.timestamp 
        && booklist.booklist.length)) {
        res.writeHead(422);
        res.end(JSON.stringify({ error: { message: "Bad booklist object"} }));
        return;
      }

      db.save(booklist.student + ':booklist', booklist, function (err, data) {
        if (err) {
          res.writeHead(422);
          res.end(JSON.stringify({ error: { message: "no savey to databasey: " + JSON.stringify(err) } }));
        }
        res.statusCode = 302;
        res.setHeader("Location", redirect);
        res.end(JSON.stringify(data));
      });
    });

    function random() {
      return 0.5 - Math.random();
    }

    var blyphSecret = 'thequickgreenlizard';
    var token = (blyphSecret + 'abcdefghijklmnopqrstuvwxyz0123456789')

    function handleSignUp(req, res) {
      var email = req.body && req.body.email
        , newUser = req.body
        ;

      // TODO make more robust
      if (!newUser || !newUser.email) {
        res.statusCode = 422;
        res.end('{ "error": { "message": "bad object" } }');
        return;
      }
      newUser.email = String(newUser.email).toLowerCase();

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
        fullUser.email = String(newUser.email);
        fullUser.school = String(newUser.school);
        fullUser.referredBy = fullUser.referredBy || newUser.referredBy;
        fullUser.referrerId = fullUser.referrerId || token.substr(0, 8);
        fullUser.confirmationSent = fullUser.confirmationSent || 0;

        if (fullUser.confirmationSent) {
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
    , queryParser()
    , CORS()
    , corsJsonSession({ secret: config.sessionSecret })


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
        res.statusCode = 302;
        res.setHeader('Location', 'http://' + config.vhost + req.url);
        // TODO set token to notify browser to notify user about www
        res.write(
            'Quit with the www already!!! It\'s not 1990 anymore!'
          + '<br/>'
          + '<a href="http://blyph.com">blyph.com</a>'
          + '<br/>NOT www.blyph.com'
          + '<br/>NOT http://www.blyph.com'
          + '<br/>just <a href="http://blyph.com">blyph.com</a>'
          + '<br/>'
          + ';-P'
        );
        res.end();
      }))
  );
  console.log('Serving vhost ' + config.vhost);

  module.exports = vhost;
}());
