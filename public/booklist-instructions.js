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

    if (!token || !token.length >= 4) {
      token = prompt("email address: ", "");
    }

    textarea.val(textarea.val().replace(uidTpl, token).replace(originTpl, origin));

    // dev
    if ('http://blyph.com' !== origin) {
      textarea.val(textarea.val().replace(":$.", ":$.ORIGIN='" + origin + "';$.").replace(originTpl, origin));
    }
  }

  $.domReady(onDomReady);

}());      
