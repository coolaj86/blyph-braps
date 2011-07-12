(function () {
  "use strict";

      function loading() {
        $('#loading').show();
      }

      function complete() {
        $('#loading').hide();
      }

      $(function () {
        $('#loading').hide();

        //var cb = CampusBooks.create("BLCg7q5VrmUBxsrETg5c");
        $('body').delegate('#email_form', 'submit', function (ev) {
          var email
            , school
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

          $.post('/subscribe', { email: email, school: school }, function (data) {
            complete();

            if (!data) {
              alert('Server Error');
              return;
            }

            alert('Thanks for your support, ' + data.email + '! You\'ll hear from us soon!');
          }, 'json');
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
