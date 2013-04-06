(function () {
  "use strict";

  var connect = require('connect')
    , steve = require('./steve')
    , api = require('./api')
    , app
    ;

  app = connect.createServer()
    .use(steve)
    .use(function (req, res, next) {
        console.log(req.url);
        next();
      })
  // these won't work CORS-style without an Access-Control-Allow
  //, connect.cookieParser()
  //, connect.session({ secret: config.secret })
    // decode http forms
    .use(connect.bodyParser())
    // REST API
    .use(api)
    ;

  module.exports = app;
}());
