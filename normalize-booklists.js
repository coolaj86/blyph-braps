(function () {
  "use strict";

  var config = require(__dirname + '/config')
    , crypto = require('crypto')
    , cradle = require('cradle')
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
        .database(config.cradle.database, function () { console.log(arguments); })
    ;


  function copyUser(booklist, fn) {
    var id = booklist._id || booklist.id;
    delete booklist._id;
    delete booklist.id;
    delete booklist.rev;
    delete booklist._rev;
    db.save(booklist.userToken + ':booklist', booklist, function (err, res) {
      if (err) {
        console.error('!!! SAVE ERROR:', err, res, booklist);
        fn(err);
        return;
      }
      console.log('saved booklist', booklist.userToken, booklist.nickname);
      fn(err);
    })
  }

  function normalize(booklist) {
    var md5sum = crypto.createHash('md5')
      , email = ((booklist.token||booklist.email)||'').trim().toLowerCase()
      ;

    if (!email) {
      if (!booklist.userToken) {
        console.log('ERROR: no userToken!!')
      }
      console.log('fresh', booklist.userToken);
      return;
    }

    if (!booklist.userToken) {
      md5sum.update(email);
      booklist.userToken = md5sum.digest('hex');
    }

    if (!booklist.nickname) {
      booklist.nickname = email.replace(/@.*/, '');
    }

    delete booklist.email;
    delete booklist.token;
    delete booklist.student;

    booklist.type = 'booklist';

    //copyUser(booklist);
    ///*
    db.get(booklist.userToken + ':booklist', function (err, res) {
      if (err) {
        console.error('missed one');
        copyUser(booklist, function (err) {
          if (err) {
            console.log('error copying');
            return;
          }
          console.log('copied', booklist.userToken, booklist.nickname);
        });
        return;
      }

      console.log('removing', booklist.nickname);
      db.remove(email + ':booklist', booklist.rev || booklist._rev, function (err) {
        console.log('bye-bye', booklist.nickname);
      });
    });
    //*/
  }

  db.view('booklist/all', function (err, data) {
    data.forEach(normalize);
  });
}());
