(function () {
  "use strict";

  function random() {
    return 0.5 - Math.random();
  }

  function create(options) {
    options = options || {};

    var secret = options.secret || (Math.random() * new Date().valueOf()).toString('36').split('').sort(random).join('')
      , checkInterval = options.checkInterval || 10 * 60 * 1000
      , maxAge = options.maxAge || 60 * 60 * 1000
      , db = {}
      ;

    function createSessionId() {
      return (secret + 
        new Date().valueOf().toString('36') + 
        (Math.random() * 19860616).toString('36')
      ).split('').sort(random).join('').replace(/[\s\W]/g, '').substr(0, 32);
    }

    function purge() {
      var now = new Date().valueOf()
        , val
        ;

      Object.keys(db).forEach(function (key) {
        val = db[key];
        if ((now - val.timestamp) > maxAge) {
          delete db[key];
        }
      });
    }

    function session(req, res, next) {
      req.activateSession = function(cb) {
        var sessionId
        ;

        // TODO add Cookie support
        if (sessionId = req.body && req.body.userSession) {
          req.sessionId = sessionId;
        } else if (sessionId = req.query && req.query.userSession) {
          req.sessionId = sessionId;
        } else {
          req.sessionId = sessionId = createSessionId();
        }

        if (!(req.session = db[sessionId])) {
          req.session = db[sessionId] = {};
        } else {
          req.session.timestamp = new Date().valueOf();
        }

        cb();
      };

      next();
    }

    setInterval(purge, checkInterval);

    return session;
  }

  module.exports = create;
}());
