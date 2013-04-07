(function () {
  "use strict";

  var nodemailer = require('nodemailer')
    , blyphMail = {}
    , instances = []
    ;

  function get(mailerOpts) {
    var mailer
      ;

    instances.some(function (instance) {
      if (mailerOpts === instance.settings) {
        mailer = instance.mailer;
        return true;
      }
    });

    if (!mailer) {
      mailer = nodemailer.createTransport(mailerOpts.protocol || "SMTP", mailerOpts);
      instances.push({
          settings: mailerOpts
        , mailer: mailer
      });
    }

    return mailer;
  }

  function send(opts, message, fn) {
    // Comma-separated lists for to, cc, etc
    /*
      from
      to
      cc
      bcc
      replyTo
      subject
      body
      html
      attachments
     */
    message.body = message.text || message.body;
    get(opts).sendMail(message, fn);
  }

  blyphMail.get = get;
  blyphMail.send = send;
  module.exports = blyphMail;
}());
