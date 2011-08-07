(function () {
  "use strict";

  var config = require('./config')
    , connect = require('connect')
    , CORS = require('connect-xcors')
    , queryParser = require('connect-queryparser')
    , mailer = require('emailjs')
    , corsJsonSession = require('./routes/cors-json-session')
    , mailserver = mailer.server.connect(config.emailjs)
    , cradle = require('cradle')
    , db = new(cradle.Connection)(config.cradle.host, config.cradle.port, config.cradle.options)
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
  function sendEmail(user, fn) {
    var headers = {
            from: "AJ ONeal <" + config.emailjs.user + ">"
          , to: user.email
          , subject: "Thanks for signing up with Blyph"
          , text: "Our monkeys are hard at work programming the trading database.\n" + 
              "\nWe'll let you know as soon as it's ready!\n" + 
              "\nIn the meantime, feel free to ask us questions.\n" + 
              "\nemail: " + user.email + 
              "\nschool: " + user.school +
              "\n" +
              "\nThanks for your support," +
              "\nAJ ONeal & Brian Turley" +
              "\nhttp://facebook.com/pages/Blyph/190889114300467" +
              "\nhttp://twitter.com" + 
              "\n" +
              "\nP.S. Our monkeys are treated in accordance with the Animal Welfare Act of 1966, " +
              "including fair wages, hours, and are not subject to animal (or human) testing."
        }
        // message.attach_alternative("<html>i <i>hope</i> this works!</html>");
      , message = mailer.message.create(headers)
      ;

    mailserver.send(message, fn);
  }

  function log(err, data) {
    console.log('err: ' + err);
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
      console.log('handleSignUp');
      var email = req.body && req.body.email
        , user = req.body
        , fullUser = {}
        ;

      // TODO make more robust
      if (!user) {
        res.statusCode = 422;
        res.end('{ "error": { "message": "bad object" } }');
        return;
      }

      res.writeHead(200, {'Content-Type': 'application/json'});

      // 
      db.get(user.email, function (err, data) {
        console.log('db.get');
        if (data && data.authToken) {
          res.end(JSON.stringify({email: user.email, couchdb: data}));
          return;
        }

        token = token.split('').sort(random).join('');

        fullUser.type = 'user';
        fullUser.email = String(user.email);
        fullUser.school = String(user.school);
        fullUser.referredBy = String(user.referredBy);
        fullUser.friendId = String(user.friendId);
        // for login via email
        fullUser.authToken = token.substr(2, 6);
        // for link tracking among friends
        fullUser.refToken = token.substr(10, 6);
        db.save(user.email, { type: 'user', email: user.email, school: user.school }, function (err, data) {
          console.log('db.save');
          sendEmail(user, function(err, message) {
            console.log('send email');
            console.log(err || message); 
          });
          res.end(JSON.stringify({email: email, couchdb: data}));
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

  vhost = connect.createServer(
    connect.vhost(config.vhost, server)
  );
  console.log('Serving vhost ' + config.vhost);

  module.exports = vhost;
}());
