(function () {
  "use strict";

  function reverse(str) {
    return str.split('').reverse().join('');
  }

  function countRanges(s, e) {
    var len
      , a
      , b
      , n
      , m
      , start
      , end
      , x
      , range = [];

    // in case there is a letter, number, letter, numbers case
    start = reverse(s).match(/(\d+)(.*)/)
    end = reverse(e).match(/(\d+)(.*)/)

    a = reverse(start[2]||'');
    b = reverse(end[2]||'');

    n = reverse(start[1]);
    m = reverse(end[1]);

    if (a !== b) {
      //console.log('not attempting to count hexdecimal or whatever', s, e);
      return [s, e];
    }

    len = n.length;
    n = parseInt(n);
    m = parseInt(m);

    if (n >= m) {
      //console.log('unexpected sequnce of numbers', s, e);
      return [s, e];
    }

    while (n <= m) {
      x = n.toString()
      while (x.length < len) {
        x = '0' + x;
      }
      range.push((a + '') + x);
      n += 1;
    }
    //range.push((b + '') +  ('' + m));

    return range;
  }


  //parseSections("001,003-005,\n A10 - A09,B003,   C34");
  function parseSections(sectionsText) {
    var sections = [];

    sectionsText.split(/\s*,\s*/).forEach(function (section) {
      var ranges = section.split(/\s*-\s*/);

      if (1 === ranges.length) {
        sections.push(ranges[0]);
        return;
      }

      if (2 !== ranges.length) {
        console.error('Could not reasonably parse "' + sectionsText + '"');
        return;
      }

      ranges = countRanges(ranges[0], ranges[1]);
      sections = sections.concat(ranges);
    });

    return sections;
  }

  module.exports = parseSections;
}());
