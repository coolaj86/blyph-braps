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


    sendEmail(user, function (err) {
      if (err) {
        console.log('error1:', err);
      } else {
        console.log(user.email + ' sent first email');
      }

      setTimeout(function () {
        sendUniqueLink(user, function (err) {
          if (err) {
            console.log('error2:', err);
          } else {
            console.log(user.email + ' sent second email');
          }

          user.sentListInvite = true;
          db.save(user.email, user, function (err, res) {
            if (err) {
              console.error('ERROR: (update 2)', err, user.email);
            }
            console.log(user.email + ' saved second email notification');
            callback();
          });
        });
      }, 30 * 1000);
    });
  }

  function sendEmail(user, fn) {
    var headers = {
            from: "AJ @ Blyph <" + config.emailjs.user + ">"
          , to: user.email
          , subject: "Hey BYU-ers: List your books on Blyph!"
          , text: "After much toil our monkeys have finally got it so that you can list your books." +
              "\nWe're still working the kinks out so please be patient, but don't hesitate to give us feedback." +
              "\n" +
              "\n" +
              "\nListing the books you have and need will make it easier for you to find a good exchange with other students and save money this semester." +
              "\n" +
              "\nYou can try the autolister:" +
              "\nhttp://blyph.com/byu.html#/?token=" + user.email +
              "\n" +
              "\nOr list books yourself by searching by title or ISBN:" +
              "\nhttp://blyph.com/booklist.html#/?token=" + user.email +
              "\n" +
              "\n" +
              "\nYou can expect another email from us as soon as there are enough books listed for us to start making matches!" +
              "\n" +
              "\n" +
              "\nThanks for your support," +
              "\nAJ ONeal <aj@blyph.com>" +
              "\nBrian Turley <brian@blyph.com>" +
              "\nLike us: http://facebook.com/pages/Blyph/190889114300467" +
              "\nFollow us: http://twitter.com/blyph" +
              ""
        }
        // message.attach_alternative("<html>i <i>hope</i> this works!</html>");
      , message = mailer.message.create(headers)
      ;

    mailserver.send(message, function (err) {
      if (err) {
        console.log(err);
      }
      fn();
    });
  }

  function sendUniqueLink(user, fn) {
    var headers = {
            from: "AJ @ Blyph <" + config.emailjs.user + ">"
          , to: user.email
          , subject: "Share Blyph and get rewarded"
          , text: "" +
              // TODO your-school-here
              "\nWe're working hard to make exchanging your books easier than ever before, but we need your help." +
              "\n" +
              "\nIn order for Blyph to work, we need more people listing books." +
              "\nSo we're rewarding you for sharing - 2 students will be reimbursed up to $350 each for Fall 2011 textbook expenses*." +
              "\n" +
              "\nHere's how it works:" +
              "\n" +
              "\n1. Copy your unique URL:" +
              "\nhttp://blyph.com#/?referredBy=" + user.referrerId +
              "\n" +
              "\n2. Share it with friends on Facebook, Twitter, through Email, etc." +
              "\n" +
              "\n3. For every friend that signs up through your link you will earn multiple entries into the reimbursement drawing:" +
              "\n" +
              "\n10 friends join - 10 entries" +
              "\n20 friends join - 40 entries" +
              "\n30 friends join - 90 entries" +
              "\n10n friends join - 10(n^2) entries (for you math geeks)" +
              "\n100 friends join - 1000 entries" +
              "\n" +
              "\nMost importantly: the more friends you invite, the greater your chance for finding the books you need at the price you deserve, and the more you save!" +
              "\n" +
              "\n/=8^P" +
              "\n" +
              "\n" +
              "\nThanks for your support," +
              "\nAJ ONeal <aj@blyph.com> (not actually a Zoobie)" +
              "\nBrian Turley <brian@blyph.com> (actually a Zoobie)" +
              "\nLike us: http://facebook.com/pages/Blyph/190889114300467" +
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
    */
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

      if (user.sentListInvite) {
        console.log('skip:', user.email, count);
        next();
        return;
      }

      console.log('attempting: ', user.email);
      inviteToPlay(user, function () {
        console.log('done with: ', user.email);
        setTimeout(function () {
          next();
        }, 30 * 1000);
      });

    }
    next();
  });


}());
