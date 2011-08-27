(function () {
  "use strict";

  var config = require(__dirname + '/config')
    , mailer = require('emailjs')
    , mailserver = mailer.server.connect(config.emailjs)
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

    if (user.knowsAboutIpad) {
      callback();
    }

    informAboutUpdates(user, function (err) {
      if (err) {
        console.error('ERROR Email:', err);
        return;
      } 

      console.log(user.email + ' sent first email');
      user.knowsAboutIpad = true;

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
          , subject: "Better Book Listing. Also: iPad sexier than reimbursement, study says"
          , text: "" +
              // TODO your-school-here
              "\nHey guys," + 
              "\n" +
              "\nWe've been listening to your feedback and we're meeting your demands:" +
              "\n" +
              "\n * We've greatly enhanced the book lister to be much easier to use." +
              "\n * We've scratched the book reimbursement in favor of a 16gb iPad2 giveaway." +
              "\n" +
              "\nIf you've listed books, but haven't tagged them as 'Have' or 'Need', *please* do so. We've got *hundreds* of books listed, but we can't finish making the matches until we know who wants them. So get on that!" +
              "\n" +
              "\nWe've been pulling some late-nighters (3am, y'know, no big deal) to get the matching service up ASAP." +
              "\nWe expect that you will be able to see your matches and start trades on Saturday." +
              "\n" +
              "\nAs always, your biggest help will be to share Blyph with your friends, frenemies, and the like." +
              "\n" +
              "\nRemember: Sharing == More Trades AND Sharing == iPad. 'nuff said" +
              "\n" +
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
        // message.attach_alternative("<html>i <i>hope</i> this works!</html>");
      , message = mailer.message.create(headers)
      ;

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
    //
    /*
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

      if (user.knowsAboutIpad) {
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
