(function () {
  "use strict";

  var fs = require('fs')
    , config = require(__dirname + '/config')
    , mailer = require('emailjs')
    , mailserver = mailer.server.connect(config.emailjs)
    , htmlEmail = fs.readFileSync('./emails/launch-email.html').toString('utf8')
    , cradle = require('cradle')
    , db = new(cradle.Connection)(config.cradle.hostname, config.cradle.port, config.cradle.options)
        .database(config.cradle.database, function () { console.log(arguments); })
    ;

  var blyphSecret = 'thequickgreenlizard';
  var token = (blyphSecret + 'abcdefghijklmnopqrstuvwxyz0123456789')

  function random() {
    return 0.5 - Math.random();
  }

  function inviteToPlay(user, callback) {
    if ('byu.edu' !== user.school) {
      return callback();
    }

    // same chars, but mixed up every time
    token = token.split('').sort(random).join('');

    user.confirmationSent = user.confirmationSent || 0;
    user.confirmationSent += 1;
    user.referrerId = user.referrerId || token.substr(0, 8);

    if (user.knowsAboutLaunch) {
      callback();
    }

    informAboutUpdates(user, function (err) {
      if (err) {
        console.error('ERROR Email:', err);
        return;
      } 

      console.log(user.email + ' sent first email');
      user.knowsAboutLaunch = true;

      db.save(user.email, user, function (err, res) {
        if (err) {
          console.error('ERROR Db:', err, user.email);
          return;
        }
        setTimeout(function () {
          callback();
        }, 5 * 1000);
      });
    });
  }

  function informAboutUpdates(user, fn) {
    var headers = {
            from: "AJ @ Blyph <" + config.emailjs.user + ">"
          , to: user.email
          , subject: "Up and Running! And Matches Available"
          , text: "" +
              // TODO your-school-here
              "\nHey guys," + 
              "\n" +
              "\nWe've launched. Time to save to moolahlah!" +
              "\n" +
              "\nhttp://blyph.com/booklist.html#/?token=" + user.email +
              "\n" +
              "\nYour unique URL to share on Facebook, Twitter, Email, etc:" +
              "\nhttp://blyph.com#/?referredBy=" + user.referrerId +
              "\n" +
              "\n" +
              "\n=/8^D" +
              "\n" +
              "\n" +
              "\nThanks for your support," +
              "\nAJ ONeal <aj@blyph.com> (not actually a Zoobie)" +
              "\nBrian Turley <brian@blyph.com> (actually a Zoobie)" +
              "\nLike us: http://fb.com/pages/Blyph/190889114300467" +
              "\nFollow us: http://twitter.com/blyph" +
              "\n" +
              "\n* Drawing details at http://blyph.com/sweepstakes-rules.html" +
              ""
        }
      , message = mailer.message.create(headers)
      ;

    message.attach_alternative(htmlEmail.replace(/@TOKEN@/g, user.email))

    mailserver.send(message, fn);
  }

  db.view('users/all', function (err, data) {
    var users = [];
    data.forEach(function (row) {
      if ('byu.edu' !== row.school) {
        return;
      }
      users.push(row);
    });
    data = users;
    console.log(users.length);
    ///*
    data = [
    {
        email: 'coolaj86+take10@gmail.com'
      , school: 'byu.edu'
      , referrerId: 'aj@blyph'
    },
    {
        email: 'coolaj86+take11@gmail.com'
      , school: 'byu.edu'
      , referrerId: 'aj@blyph'
    }
    ];
    //*/
    var count = 0;

    function next() {
      var user;

      console.log(data.length);
      console.log(count);
      count += 1;

      user = data.pop();
      //console.log(user);
      if (!user) {
        if (data.length) {
          console.log('how odd indeed');
          next();
        }
        return;
      } 

      if (user.knowsAboutLaunch) {
        console.log('skip:', user.email, count);
        next();
        return;
      }

      console.log('attempting: ', user.email);
      inviteToPlay(user, function () {
        console.log('done with: ', user.email);
        setTimeout(function () {
          next();
        }, 35 * 1000);
      });

    }
    next();
  });


}());
