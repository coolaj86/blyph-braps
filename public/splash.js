(function () {
  "use strict";

      function loading() {
        $('#loading').show();
      }

      function complete() {
        $('#loading').hide();
      }

      $(function () {
        var friendId = location.hash.match(/friendId=(.*)/)
          , referredBy = location.hash.match(/referredBy=(.*)/) || location.hash.match(/(?:\?|&)r=(.*)/)
          ;

        location.hash = '#';

        $('#loading').hide();

        //var cb = CampusBooks.create("BLCg7q5VrmUBxsrETg5c");
        $('body').delegate('#email_form', 'submit', function (ev) {
          var email
            , school
            , users
            , user
            , data = {}
            ;

          ev.preventDefault();

          email = $('input[name=email]').val();
          school = $('input[name=school]').val();

          if (!email || !email.match(/\w+@\w+.\w+/)) {
            alert('bad email address');
            return;
          }

          if (!school || !school.match(/\w+.edu/) && !school.match(/\w+.gov/)) {
            alert('Put a University url such as "byu.edu"');
            return;
          }

          loading();

          data.email = email;
          data.school = school;
          if (friendId) {
            // TODO prompt for referral info
            data.friendId = friendId[1];
          }
          if (referredBy) {
            data.referredBy = referredBy[1];
          }

          $.post('/subscribe', data, function (echo) {
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

            $('#email_form').html(
                'Thanks for your support, ' + echo.email +
                '!<br/> You\'ll hear from us soon!' +
                '<br/>' +
                '<br/>' +
                'In the meantime, earn yourself some more entries into our drawing by sharing this unique link with your BYU and UVU friends: ' +
                '<br/>' +
                '<a href="http://blyph.com/#/?referredBy=' + echo.couchdb.referrerId + '">' +
                'http://blyph.com/#/?referredBy=' + echo.couchdb.referrerId + '</a>' + 
                '<br/>' +
                '<br/>' +
                'We also just sent you an e-mail with that link. :-D' +
                ''
              );
          }, 'json');

          users = localStorage.getItem('users') || '{}';
          users = JSON.parse(users);
          user = users[email] = users[email] || {};
          user.email = email;
          user.school = school;
          user.timestamp = new Date().valueOf();
          localStorage.setItem('users', JSON.stringify(users));
        });
        /*
        $('body').delegate('#booksearch', 'submit', function (ev) {
          ev.preventDefault();
          var keywords = $('input[name=book_keywords]').val();
          cb.search({ keywords: keywords }).when(function (err, data, xhr) {
            alert('Results for "' + keywords + '": ' +  JSON.stringify(data));
          });
        });
        */
      });

}());
