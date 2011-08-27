(function () {
  "use strict";

  var config = require(__dirname + '/config')
    , cradle = require('cradle')
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
        .database(config.cradle.database, function () { console.log(arguments); })
    ;


  function copyUser(user) {
    db.remove(user._id, user._rev, function (err, res) {
      if (err) {
        console.error('ERROR:', err, res, user);
      }
      console.log("'" + user.oldemail + "' -> '" + user.email + "'");
      delete user.oldemail;
      delete user.oldschool;
      db.save(user.email, user, function (err, res) {
        if (err) {
          console.error('!!! SAVE ERROR:', err, res, user);
        }
      })
    });
  }

  function correctUser(user) {
    console.log("'" + user.oldschool + "' -> '" + user.school + "'");
    delete user.oldschool;
    db.save(user._id, user, function (err, res) {
      if (err) {
        console.error('ERROR: (update)', err, res, user);
      }
    });
  }

  function normalize(user) {
    var toCopy = false
      , toCorrect = false
      , school
      ;

    if (user.email !== user.email.trim().toLowerCase()) {
      toCopy = true;
      user.email = user.email.trim().toLowerCase();
      user.oldemail = user.email;
    }

    if (!user.school) {
      console.log('badschool:', user);
      return;
    }

    school = user.school.match(/(?:www\.)?([\w\-\.]+.edu)/i) || '';
    school = school && school[1] || '';
    school = school.toLowerCase();
    if (school !== user.school || user.type) {
      toCorrect = true;
      user.oldschool = user.school;
      user.school = school;
    }

    if ('user' !== user.type) {
      user.type = 'user';
      toCorrect = true;
    }

    if (toCopy) {
      copyUser(user);
    } else if (toCorrect) {
      correctUser(user);
    }
  }

  db.view('users/all', function (err, data) {
    data.forEach(normalize);
  });
}());
