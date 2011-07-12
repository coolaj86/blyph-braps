(function () {
  "use strict";

  var connect = require('connect')
    , cradle = require('cradle')
    , db = new(cradle.Connection)('coolaj86.couchone.com', 443, {
          secure: true
        , auth: { username: 'coolaj86', password: 'Wh1t3Ch3dd3r' }
      }).database('syllabi', function () { console.log(arguments); })
    , server
    , vhost
    ;


  function log(err, data) {
    console.log('err: ' + err);
    console.log('data: ' + JSON.stringify(data));
  }

  function rest(app) {
    app.get('/schools', function (req, res) {
      db.view('schools/all', function (err, schools) {
        res.end(JSON.stringify(schools));
      });
    });

    function handleSignUp(req, res) {
      // TODO make more robust
      res.writeHead(200, {'Content-Type': 'application/json'});
      db.save(req.body.email, { email: req.body.email, school: req.body.school }, function (err, data) {
        console.log('saved');
        //db.getDoc(req.body.email, function (err, data) {
          res.end(JSON.stringify({email: req.body.email, couchdb: data}));
        //});
      });
    }

    app.get('/subscribe/:user@:domain.:tld', function(req, res) {
      req.body = req.params;

      handleSignUp(req, res);
    });

    app.post('/subscribe', handleSignUp);
  };

  server = connect.createServer(
    // images, css, etc
      connect.static(__dirname + '/public')

    // decode html forms
    , connect.bodyParser()

    // REST API
    , connect.router(rest)
  );

  vhost = connect.createServer(
    connect.vhost('blyph.com', server),
    connect.vhost('www.blyph.com', server)
  );

  module.exports = vhost;
}());
