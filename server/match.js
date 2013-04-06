(function () {
  "use strict";

  var config = require(__dirname + '/../config')
    , blyphMail = require('./blyph-mail')
    , db
    ;

  function emailMatchMessage(message, fn) {
    if (/^\$/.exec(message.fairPrice)) {
      message.fairPrice = message.fairPrice.substr(1);
    } else if (/\d/.exec(message.fairPrice)) {
      // nada
    } else {
      message.fairPrice = undefined;
    }

    console.log('message 0', message);

    // TODO use Join
    db.get(message.to, function (err, res) {
      if (err) {
        fn(err);
        return;
      }

      console.log('message 1', message);

      message.to = res.email;

      db.get(message.from, function (err, res) {
        if (err) {
          fn(err);
          return;
        }

        console.log('message 2', message);
        console.log('res 1 ', res);

        message.from = res.email;

        var headers = {
                from: "AJ @ Blyph <" + config.mailer.user + ">"
                // TODO sanatize / validate this carefully
              , to: message.to
              , cc: message.from
              , replyTo: message.from
              , subject: message.from.replace(/@.*/i, '') + " wants to exchange " + message.bookTitle
              , body: "" +
                  "\n Who: " + message.from +
                  "\n What: " + message.bookTitle +
                  (Number(message.fairPrice) ? ("\n Our Fair Price Guesstimate: $" + message.fairPrice) : '') + 
                  "\n Quoted Message:" +
                  "\n" +
                  "\n" + message.body +
                  "\n" +
                  "\n ===============" +
                  "\n" +
                  "\n" +
                  "\nIf the above message contains offensive or otherwise inappropriate content please forward it directly to aj@blyph.com" +
                  "\n" +
                  "\nThanks for your support," +
                  "\nAJ ONeal <aj@blyph.com> (http://fb.com/coolaj86)" +
                  "\nBrian Turley <brian@blyph.com> (http://fb.com/brian.turley03)" +
                  "\nLike us: http://fb.com/blyph" +
                  "\nFollow us: http://twitter.com/blyph" +
                  "\n" +
                  "\nUnsubscribe: Send a message with your feedback to unsubscribe@blyph.com" +
                  ""
            }
          ;

        blyphMail.send(config.mailer, headers, fn);
      });
    });
  }

  exports.init = function (_db) {
    db = _db;
  };
  exports.emailMatchMessage = emailMatchMessage;
}());
