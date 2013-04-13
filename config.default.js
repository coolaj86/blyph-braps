/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true undef:true unused:true*/
(function () {
  "use strict";

  module.exports = {
      port: 3080
    , sessionSecret: "something kinda secret"
    , mailer: {
          user: "braps@braps.com"
        , auth: {
              user: "braps@braps.com"
            , pass: "another kind of secret"
          }
        , host: "smtp.gmail.com"
        , ssl: true
        , service: "Gmail"
      }
    , cradle: {
          hostname: 'braps.iriscouch.com'
        , port: 443
        , options: {
              secure: true
            , auth: {
                  username: 'braps'
                , password: 'another kind of secret'
              }
          }
        , database: 'braps'
      }
  };
}());
