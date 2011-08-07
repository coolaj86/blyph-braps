(function () {
  "use strict";

  var fs = require('fs')
    , ISBN = require('isbn').ISBN
    , byuDepartments = JSON.parse(fs.readFileSync('./byu-bookexchange.json'))
    , isbns = {}
    , badIsbns = {}
    ;

  byuDepartments.forEach(function (dept) {
    //console.log(dept.name);
    if (!dept.courses) {
      return;
    }
    dept.courses.forEach(function (course) {
      //console.log(course.name);
      if (!course.posts)  {
        return;
      }
      course.posts.forEach(function (post) {
        var isbn;
        
        post.isbn = post.isbn.replace(/\D/g, '');

        if (!post.isbn) {
          return;
        }

        if (post.isbn.match(/^10\d{10}$/) || post.isbn.match(/^13\d{13}$/)) {
          post.isbn = post.isbn.substr(2);
          console.log('[fixed isbn] ' + post.isbn);
        }

        if (isbn = ISBN.parse(post.isbn)) {
          isbns[isbn.asIsbn13()] = true;
          return;
        } 

        if (post.isbn.match(/^978\d{10,10}$/) || post.isbn.match(/^\d{10}$/)) {
          if (!isbns[post.isbn]) {
            //console.log('weird isbn? ' + post.isbn);
            isbns[post.isbn] = true;
          }
          return;
        }

        if (!badIsbns[post.isbn]) {
          //console.error('[BAD ISBN] ' + post.isbn);
          badIsbns[post.isbn] = true;
        }
      });
    });
  });

  console.log(Object.keys(isbns).length);
  fs.writeFileSync('./byu-isbns.json', JSON.stringify(Object.keys(isbns)), 'utf8');
}());
