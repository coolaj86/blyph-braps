(function () {
  "use strict";

  var config = require('./config')
    , connect = require('connect')
    , mailer = require('emailjs')
    , mailserver = mailer.server.connect({
          user: "aj@blyph.com"
        , password: "Wh1t3Ch3dd3r"
        , host: "smtp.gmail.com"
        , ssl: true
      })
    , cradle = require('cradle')
    , db = new(cradle.Connection)('coolaj86.couchone.com', 443, {
          secure: true
        , auth: { username: 'coolaj86', password: 'Wh1t3Ch3dd3r' }
      }).database('syllabi', function () { console.log(arguments); })
    , server
    , vhost
    ;

  function handleSchool(school) {
    // "http://www.byu.edu".match(/.*\b(\w+\.\w+)/);
    // "byu.edu".match(/.*\b(\w+\.\w+)/);
    school = school || '';
    school = school.trim().toLowerCase();
    school = school.match(/.*\b(\w+\.\w+)/);
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

  function sendEmail(user, fn) {
    var headers = {
            from: "AJ ONeal <aj@blyph.com>"
          , to: user.email
          , subject: "Thanks for signing up with Blyph"
          , text: "email: " + user.email + " \nschool: " + user.school + " \n"
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
        if (data && data.authToken) {
          res.end(JSON.stringify({email: user.email, couchdb: data}));
          return;
        }

        token = token.split('').sort(random).join('');

        fullUser.type = 'user';
        fullUser.email = String(user.email);
        fullUser.school = String(user.school);
        // for login via email
        fullUser.authToken = token.substr(2, 6);
        // for link tracking among friends
        fullUser.refToken = token.substr(10, 6);
        db.save(user.email, { type: 'user', email: user.email, school: user.school }, function (err, data) {
          sendEmail(user, function(err, message) {
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
    console.log(req);
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

    , connect.cookieParser()
    , connect.session({ secret: 'Baby, ride your Firebolt!' })

    // decode html forms
    , connect.bodyParser()

    // cors uploads
    , booklistscraper

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
