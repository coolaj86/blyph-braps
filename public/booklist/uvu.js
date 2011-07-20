/*
  var jqScript = document.createElement('script');
  jqScript.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.js";
  document.body.appendChild(jqScript);


  var uvuScript = document.createElement('script');
  uvuScript.src = "http://alpha.blyph.com/booklist/uvu.js";
  document.body.appendChild(uvuScript);
 */


// Got the booklist from
// http://www.uvu.edu/bookstore/images/SummerBookList2011c.pdf
// 
// The used this pdf to html converter
// http://www.pdfonline.com/convert-pdf-to-html/
//
// then unpacked the .zip and ran this sript as show above
//(function () {
  "use strict";

  function parseCourse() {
    var course = {
            course: ''
          , section: ''
          , books: []
        }
      , cleanSecEnd = false // prevent pushing the first empty course object
      , courses = []
      ;

    function newCourse() {
      course.sections = [];
      course.sections = course.section.split(',');
      // TODO handle cases such as A01-A03
      courses.push(course);
      course = {
          dept: ''
        , course: ''
        , section: ''
        , books: []
      };
    }

    // if the last row did not have a trailing - or ,
    // and the current row does not have a leading - or ,
    // and the current row is not blank
    // then this current row is a new course
    //
    // "A01"
    // "A01," "A02"
    // "A01" ",A02"
    // "A01" ",A02," "A03"
    // "A01," "A02" ",A03"
    function isNewCourse(section, i, row) {
      var cleanSecStart
        , curCleanSecEnd = cleanSecEnd
        ;

      if (0 === section.length) {
        // we can't tell anything useful from a blank row
        return false;
      }

      cleanSecStart = !section.match(/^-|,/) && !!section.match(/^[a-z]/i);
      cleanSecEnd = !!section.match(/\d$/);
      /*
      console.log('curCleanSecEnd', curCleanSecEnd);
      console.log('cleanSecStart', cleanSecStart);
      console.log('cleanSecEnd', cleanSecEnd);
      */

      if (!curCleanSecEnd) {
        // if the last section didn't end cleanly,
        // we expect this one to start cleanly // TODO check that?
        // and we know it's not a new course
        if (!cleanSecStart) {
          console.error('parse error: unclean end and unclean start');
          console.error(i, row);
        }
        return false;
      }

      if (!cleanSecStart) {
          return false;
      }

      // is not empty
      // had cleanSecEnd last time  (no trailing , or -)
      // has cleanSecStart this time (no leading , or -)
      return true;
    }

    function parseRow(i, row) {
      var cells = $(row).find('td')
        , info = {}
        , book = {}
        , dept
        ;

      course.dept = dept = $(cells[0]).text().trim() || course.dept;
      if (dept.match(/^Dept$/) || dept.match(/^Prices and Titles are Subject to Change$/)) {
        console.log('useless line');
        return;
      }

      course.course = $(cells[1]).text().trim() || course.course;
      info.section = $(cells[2]).text().trim();
      // skip author
      // skip title
      book.isbn = $(cells[5]).text().trim();
      // skip $
      book.newPrice = $(cells[7]).text().trim();
      // skip $
      book.usedPrice = $(cells[9]).text().trim();

      if (isNewCourse(info.section, i, row)) {
        newCourse();
      }
      course.section += info.section;

      if (book.isbn.match(/^\d{13}$/)) {
        // uvu's internal fake isbn for no textbook
        // all isbn 13s start with 978-
        if ("9780840004925" !== book.isbn) {
          course.books.push(book);
        }
      }
    }

    var catchresult = $('tr').each(parseRow);

    return courses;
  }

  parseCourse();

  function getAllIsbns() {
    var isbns = {};

    $('td').each(function (i, el) {
      var text = $(el).text().trim();
      if (text.match(/^\d{13}$/)) {
        isbns[text] = true;
      }
    });

    delete isbns["9780840004925"];
    return Object.keys(isbns);
  }

  //getAllIsbns();

//}());
