(function () {
    var mailer   = require("emailjs")
      , mailserver  = mailer.server.connect({
            user:     "aj@blyph.com"
          , password: "Wh1t3Ch3dd3r"
          , host:     "smtp.gmail.com"
          , ssl:      true
        })
      , headers = {
            from:     "AJ ONeal <aj@blyph.com>" 
          , to:       "AJ ONeal <coolaj86@gmail.com>"
          , subject:  "Test 4"
          , text:     "Testing from the blyph.com address."
        }
      , message = mailer.message.create(headers)
      ;

    mailserver.send(message, function(err, message) { console.log(err || message); });
}());
