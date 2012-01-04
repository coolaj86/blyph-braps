(function () {
  "use strict";

  var SUBJECT = "It's 1am. Do you know where your textbooks are?";
  var TXT_FILE = __dirname + "/../emails/do-you-know-where-your-books-are.tpl.txt";
  //var HTML_FILE = __dirname + "/../emails/end-of-semester.email.tpl.html";
  // must be a number YYYYMMDD
  var NUM_DATE = 20111212;

  var config = require(__dirname + '/../config')
    , fs = require('fs')
    , mailer = require('emailjs')
    , mailserver = mailer.server.connect(config.emailjs)
    , cradle = require('cradle')
    , db = new (cradle.Connection)(
          config.cradle.hostname
        , config.cradle.port
        , config.cradle.options
      )
        .database(config.cradle.database, function () {
          console.log(arguments);
        })
    , messageTxt
    ;

  messageTxt = fs.readFileSync(TXT_FILE);

  function inviteToPlay(user, callback) {
    var id = user.id || user._id
      , rev = user.rev || user._rev
      , headers
      , message
      ;

    function fn(err) {
      if (err) {
        console.error('ERROR Email:', err);
        return;
      } 

      db.save(id, rev, user, function (err, res) {
        if (err) {
          console.error('ERROR Db:', err, user.email);
          return;
        }

        console.log('Saved ', user.email);

        setTimeout(function () {
          callback();
        }, 5 * 1000);
      });
    }

    if (!/byu.edu/.exec(user.school)) {
      return callback();
    }

    if (user.confirmationSent >= NUM_DATE) {
      console.log('skipping, already emailed');
      return callback();
    }

    user.confirmationSent = NUM_DATE;

    headers = {
        from: "AJ @ Blyph <" + config.emailjs.user + ">"
      , to: user.email
      , subject: SUBJECT
      , text: messageTxt
    };

    // message.attach_alternative("<html>i <i>hope</i> this works!</html>");
    message = mailer.message.create(headers);

    mailserver.send(message, fn);
  }

  db.view('users/all', function (err, data) {
    var users = []
      , count
      , len
      ;

    function next() {
      var user
        ;

      count += 1;
      console.log(count + '/' + len);

      user = data.pop();

      if (!user) {
        if (data.length) {
          console.log('no user? how odd indeed');
          next();
        }
        return;
      } 

      console.log('attempting: ', user.email);

      inviteToPlay(user, function () {

        console.log('done with: ', user.email);
        setTimeout(next, 60 * 1000);

      });

    }


    data.forEach(function (row) {
      if ('byu.edu' !== row.school) {
        return;
      }
      users.push(row);
    });
    data = users;
    len = users.length;

    // start off
    count = 0;
    console.log(len);

    next();
  });

}());
