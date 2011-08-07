(function () {
  "use strict";

  // TODO error message without call stack
  function stringifyError() {
    // message
    // code
  }

  function create(config) {
    config = config || {};

    function sendJson(req, res, next) {
      req.sendJson = function (err, data, opts) {
        var json;

        if ('string' === typeof data) {
          try {
            data = JSON.parse(data);
          } catch(e) {
            // TODO return the error?
            console.error(e);
            err = err || e;
          }
        }

        data = data || {};

        if (err && !data.error && !data.errors) {
          if ('string' === typeof err) {
            data.error = data.error || { 
                message: err
            };
          } else if (Array.isArray(err)) {
            // TODO
            data.errors = data.errors || JSON.stringify(err);
          } else { // Assume some MyError type
            data.error = data.error
          }
        }

        if (config.debug || opts.debug) {
          json = JSON.stringify(data, null, '  ');
        } else {
          try {
            json = JSON.stringify(data);
          } catch(e) {
            json = JSON.stringify(e);
          }
        }

        // TODO statusCode
        res.setHeader('Content-Type', 'application/json');
        res.end(json);
      };

      next();
    }

    return sendJson;
  }

  module.exports = create;
}());
