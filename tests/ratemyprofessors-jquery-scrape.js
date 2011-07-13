(function () {
  "use strict";

  var depts = [];
  $('select[name=the_dept] option').each(function (i, data) {
    depts.push($(data).text()) 
  });
  console.log(depts);

  function scrapeBooks(data) {
  }

  function scrapeCourses(data) {
    var course = {};
    course.course = $(data).find('.class').text();
    course.date = $(data).find('.date').text();
    return course;
  }

  function scrapeProf(data) {
    var prof = {};
    prof.name = $(data).find('.profName').text();
    prof.dept = $(data).find('.profDept').text();
    prof.photo = $(data).find('.profPhoto.hasPhoto img').attr('src');
    prof.link = $(data).find('.profName a').attr('href');
    prof.id = prof.link.match(/tid=(\d+)/)[1];
    return prof;
  }

  var profs = [];
  var courses = [];

  var sid = '135';
  var ALPHA = 'A';
  $.get('/SelectTeacher.jsp?the_dept=All&sid=' + sid + '&orderby=TLName&letter=' + ALPHA, function (page, status, xhr1) {
    $(page).find('div.entry').each(function (i, data) {
      profs.push(scrapeProf(data));
    });
    console.log(profs);
  }, 'xml');

  var tid = '753729';
  $.get('ShowRatings.jsp?tid=' + tid, function (page, status, xhr1) {
    $(page).find('#ratingTable div.entry').each(function (i, data) {
      courses.push(scrapeCourses(data));
    });
    console.log(courses);
  }, 'xml');

}());
