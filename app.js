(function () {
  "use strict";

  var connect = require('connect')
    , cradle = require('cradle')
    , db = new(cradle.Connection)('coolaj86.couchone.com', 443, {
          secure: true
        , auth: { username: 'coolaj86', password: 'Wh1t3Ch3dd3r' }
      }).database('syllabi', function () { console.log(arguments); })
    , server
    ;


  function log(err, data) {
    console.log('err: ' + err);
    console.log('data: ' + JSON.stringify(data));
  }

  function rest(app) {
    app.get('/subscribe/:user@:domain.:tld', function(req, res) {
      // TODO make more robust
      var email = req.params.user + '@' + req.params.domain + '.' + req.params.tld;
      res.writeHead(200, {'Content-Type': 'application/json'});
      db.save(email, {email: email}, function (err, data) {
        //db.getDoc(email, function (err, data) {
          res.end(JSON.stringify({email: email, couchdb: data}));
        //});
      });
    });
    app.post('/subscribe', function(req, res) {
      // TODO make more robust
      res.writeHead(200, {'Content-Type': 'application/json'});
      db.save(req.body.email, {email: req.body.email}, function (err, data) {
        console.log('saved');
        //db.getDoc(req.body.email, function (err, data) {
          res.end(JSON.stringify({email: req.body.email, couchdb: data}));
        //});
      });
    });
  };

  server = connect.createServer(
    // images, css, etc
      connect.static(__dirname + '/public')

    // decode html forms
    , connect.bodyParser()

    // REST API
    , connect.router(rest)
  );

  module.exports = server;

  server.listen(3001);
}());
