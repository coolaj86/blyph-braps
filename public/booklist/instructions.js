(function () {
  "use strict";

  $.domReady = $;

  // TODO login the user

  function onDomReady() {
    // '#/?token=767e5a2065'
    var token = location.hash.substr(1)
      , origin = location.protocol + '//' + location.host
      , textarea = $('#text-area')
      , uidTpl = 'TOKEN_TPL'
      , originTpl = 'http://TPL.EXAMPLE.COM'
      ;

    textarea.val(textarea.val().replace(originTpl, origin));

    // dev
    if ('http://blyph.com' !== origin) {
      textarea.val(textarea.val().replace("javascript:", "javascript:window.ORIGIN='" + origin + "';").replace(originTpl, origin));
    }

    if (token && token.length >= 4) {
      localStorage.setItem('auth:token', token);
      return;
    }

    setTimeout(function () {
      while (!token) {
        token = prompt("email address: ", "");
      }
      localStorage.setItem('auth:token', token);
      textarea.val(textarea.val().replace(uidTpl, token));
    }, 1000);
  }

  $.domReady(onDomReady);
}());      
