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
          ;

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

          $.post('/subscribe', data, function (echo) {
            complete();

            if (!echo) {
              alert('Server Error');
              return;
            }

            alert('Thanks for your support, ' + echo.email + '! You\'ll hear from us soon!');
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
