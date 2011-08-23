(function () {
  "use strict";

  var pattern = /(?:\?|&)token=(.*?)(?:&|$)/;
  /*
  pattern.exec('/?token=coolaj86@gmail.com');
  pattern.exec('/?blah=bleh&token=coolaj86@gmail.com');
  pattern.exec('/?blah=bleh&token=coolaj86@gmail.com&java=joe');
  */

  $.domReady = $;

  // TODO login the user

  function onDomReady() {
    // '#/?token=767e5a2065'
    var token = pattern.exec(location.hash)
      , origin = location.protocol + '//' + location.host
      , textarea = $('#text-area')
      , uidTpl = 'TOKEN_TPL'
      , originTpl = 'http://TPL.EXAMPLE.COM'
      ;

    location.hash = '';

    token = token && token[1]

    textarea.val(textarea.val().replace(originTpl, origin));

    // dev
    if ('http://blyph.com' !== origin) {
      textarea.val(textarea.val().replace("avascript:", "avascript:window.ORIGIN='" + origin + "';").replace(originTpl, origin));
    }

    function validateToken(token) {
      return token && token.length >= 4;
    }

    setTimeout(function () {
      while (!validateToken(token)) {
        token = prompt("email address: ", "");
      }
      localStorage.setItem('auth:token', token);
      textarea.val(textarea.val().replace(uidTpl, token));
    }, 300);
  }

  $.domReady(onDomReady);
}());      
