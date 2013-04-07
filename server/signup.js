(function () {
  "use strict";
  
  var fs = require('fs')
    , BlyphUser = require('./user')
    , blyphMail = require('./blyph-mail')
    , defaultWelcome
    , defaultSubject
    , config
    , db
    ;

  defaultWelcome = fs.readFileSync(__dirname + '/../emails/welcome-2012-12-21.tpl.txt').toString('utf8');
  defaultSubject = "Welcome to Blyph";
  //"You can't beat personal contact, but you can explodinate asteroids";

  function unsubscribe(req, res) {
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

  module.exports.handleSignUp = handleSignUp;
  module.exports.handleUnsubscribe = unsubscribe;
  module.exports.init = function (_config, _db) {
    config = _config;
    db = _db;
  };
}());
