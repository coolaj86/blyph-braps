/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true unused:true undef:true*/
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
        instance = instance.mailer;
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

  function send(opts, message) {
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
    get(opts).sendMail(message);
  }

  blyphMail.get = get;
  blyphMail.send = send;
  module.exports = blyphMail;
}());
