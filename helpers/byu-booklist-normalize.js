(function () {
  "use strict";

  var fs = require('fs')
    , json = fs.readFileSync('./byu-jameson-booklist.json')
    , data = JSON.parse(json)
    , booklist = {};
    , terms
    ;

  // a semester is in the format YY-SS
  // 1 - FA - Sep
  // 2 - FB - Nov
  // 3 - WA - Jan
  // 4 - WB - Mar
  // 5 - SA - Apr
  // 6 - SB - Jun

  terms = {};
  data.forEach(function (semester) {
    var semestername = '';
    if (!semester.courses) {
      return;
    }
    semestername += semester.year.substr(2);
    semestername += semester.term
    terms[semestername] = semesters.courses;
    semesters.courses.forEach(function (course) {
      course.
    });
    //semester.year
    //semester.semester
    //semester.term
    //semester.courses
  });

  booklist.timestamp = new Date().valueOf();
  booklist.type = 'booklist';
  booklist.school = 'byu';
  booklist.student = 'beatgammit@gmail.com';
  booklist.booklist = terms;
}());
