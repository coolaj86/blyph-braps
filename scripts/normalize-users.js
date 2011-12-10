(function () {
  "use strict";

  var config = require(__dirname + '/config')
    , crypto = require('crypto')
    , cradle = require('cradle')
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
        .database(config.cradle.database, function () { console.log(arguments); })
    ;


  function copyUser(user) {
    var id = user._id;
    db.save(user.userToken, user, function (err, res) {
      if (err) {
        console.error('!!! SAVE ERROR:', err, res, user);
        return;
      }
      console.log('saved user', user.userToken, user.email);
      /*
      db.remove(user._id, user._rev, function (err, res) {
        if (err) {
          console.error('ERROR:', err, res, user);
        }
        console.log("'" + user.oldemail + "' -> '" + user.email + "'");
        delete user.oldemail;
        delete user.oldschool;
      });
      */
    })
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
    var md5sum = crypto.createHash('md5')
      ;

    if (!user.userToken) {
      md5sum.update(user.email.trim().toLowerCase());
      user.userToken = md5sum.digest('hex');
    }

    if (!user.nickname) {
      user.nickname = user.email.replace(/@.*/, '');
    }

    user.type = 'user';

    db.get(user.userToken, function (err) {
      if (err) {
        console.log('missed one...');
        copyUser(user);
        return;
      }

      console.log('removing', user.email);
      db.remove(user.email, user.rev || user._rev, function () {
        console.log('bye-bye', user.userToken, user.email);
      });
    });
  }

  db.view('users/all', function (err, data) {
    data.forEach(normalize);
  });
}());
