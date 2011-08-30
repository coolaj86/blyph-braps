(function () {
  "use strict";

  var $ = require('jQuery')
    , url = require('url')
    , request = require('ahr2')
    , localStorage = require('localStorage')
    , JsonStorage = require('json-storage')
    , jsonStorage = JsonStorage(localStorage)
    ;

      function loading() {
        $('#loading').show();
      }

      function complete() {
        $('#loading').hide();
      }

      $(function () {
        var hashStr = location.hash.substr()
          , queryObj = url.parse(hashStr.substr(1), true).query
          , referredBy = queryObj.referredBy
          , referrerIdM = /referrerId=(.*)/.exec(hashStr)
          ;

        if (referrerIdM) {
          queryObj.referredBy = referredBy = referrerIdM[1];
        }

        location.hash = '#';

        $('#loading').hide();

        //console.log($, $('body'), $('body').delegate);
        $('body').delegate('#email_form', 'submit', function (ev) {
          var email
            , school
            , users
            , user
            , data = {}
            ;

          ev.preventDefault();

          // TODO this must be done on the application side as well!!!
          email = $('input[name=email]').val().toLowerCase();
          school = $('input[name=school]').val().toLowerCase();

          if (!email || !email.match(/\w+@\w+.\w+/)) {
            alert('bad email address');
            return;
          }

          if (!school || !school.match(/\w+.edu/i) && !school.match(/\w+.gov/i)) {
            alert('Put a University url such as "byu.edu"');
            return;
          }

          loading();

          data.email = email;
          data.school = school;
          if (referredBy) {
            data.referredBy = referredBy[1];
          }
          data.referredBy = data.referredBy;

          function onSubscribe(err, ahr, echo) {
            complete();

            if (!echo) {
              $('#email_form').html(
                  "Error: A monkey wrench must have gotten stuck in one of the server gizmos." +
                  "<br/>" +
                  "If it's not working in 5 minutes please call AJ"
                );
              $('#gvoice').click();
              return;
            }

            jsonStorage.set('user', echo.couchdb);
            jsonStorage.set('referrerId', echo.couchdb.referrerId);
            if ('byu.edu' === echo.couchdb.school) {
              location.replace('/' + 'booklist' + '.html#/?token=' + echo.couchdb.email);
              return;
            }

            // '<a href="http://blyph.com/#/?referredBy=' + echo.couchdb.referrerId + '">' +
            // 'http://blyph.com/#/?referredBy=' + echo.couchdb.referrerId + '</a>' + 
          }

          request({
              method: 'POST'
            , href: '/subscribe'
            , body: data
          }).when(onSubscribe);

          users = jsonStorage.get('users') || '{}';
          user = users[email] = users[email] || {};
          user.email = email;
          user.school = school;
          user.timestamp = new Date().valueOf();
          jsonStorage.set('users', users);
        });
      });

      $('body').delegate('#gvoice', 'click', function (ev) {
        ev.preventDefault();
        $('#gvoice').hide();
        $('#gvoiceWidget').show();
        $('#gvoiceWidget').click();
      });
}());
