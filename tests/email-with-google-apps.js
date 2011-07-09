(function () {
    var email   = require("emailjs")
      , server  = email.server.connect({
        //  user:     "coolaj86@gmail.com"
        //, password: "bmsrbxzqbcninxwa"
            user:     "aj@blyph.com"
          , password: "Wh1t3Ch3dd3r"
        //, password: "Bad-Pass"
          , host:     "smtp.gmail.com"
          , ssl:      true
        })
      , headers = {
            from:     "AJ ONeal <aj@blyph.com>" 
          , to:       "Brian Turley <turleybw@gmail.com>"
        //, cc:       "Djamshid Mavandi <mvndaai@gmail.com>, Alvin ONeal <alvin.oneal@gmail.com>"
          , subject:  "Test 2"
          , text:     "Testing from the blyph.com address."
        }
      , message = email.message.create(headers)
      ;

    // create the message

    // attach an alternative html email for those with advanced email clients
    // message.attach_alternative("<html>i <i>hope</i> this works!</html>");

    // attach attachments because you can!
    //message.attach("path/to/file.zip", "application/zip", "renamed.zip");

    // send the message and get a callback with an error or details of the message that was sent
    server.send(message, function(err, message) { console.log(err || message); });

    // you can continue to send more messages with successive calls to 'server.send', 
    // they will be queued on the same smtp connection

    // or you can create a new server connection with 'email.server.connect' 
    // to asynchronously send individual emails instead of a queue 
}());
