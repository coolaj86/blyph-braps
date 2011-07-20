(function () {
  "use strict";

  var connect = require('connect')
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

    function handleSignUp(req, res) {
      var email = req.body && req.body.email;
      var user = req.body;

      // TODO make more robust
      res.writeHead(200, {'Content-Type': 'application/json'});

      // 
      db.get(user.email, function (err, data) {
        if (data) {
          res.end(JSON.stringify({email: user.email, couchdb: data}));
          return;
        }

        db.save(user.email, { email: user.email, school: user.school }, function (err, data) {
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
    // decode html forms
      connect.bodyParser()

    // cors uploads
    , booklistscraper

    // images, css, etc
    , connect.static(__dirname + '/public')

    , connect.favicon(__dirname + '/public/favicon.ico')

    // REST API
    , connect.router(rest)
  );

  vhost = connect.createServer(
    connect.vhost('alpha.blyph.com', server)
  );

  module.exports = vhost;
}());
