#!/usr/bin/env node
/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var app = require('../server')
    , server
    ;

  server = app.listen(process.argv[2] || 3000, function () {
    console.log("Listening on 0.0.0.0:" + server.address().port);
  });
}());
