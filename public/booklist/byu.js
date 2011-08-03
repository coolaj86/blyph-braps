(function () {
  "use strict";

  // bring up a blyph box
  // cause interaction about books
  // have it?
    // I'm keeping it for now
    // I'd like to trade it
  // need it?
    // I prefer to trade / buy / rent
  var userId = $.BLYPH;
  var form = "" +
            "<form id='booklist' method='POST' action='http://alpha.blyph.com/booklistscraper'>" +
              "<textarea id='blyphmas' name='booklist'></textarea>" +
              "<input type='submit' name='submital' value='Send Book Info' />" +
            "</form>";
  $('body').html('Getting your book info...' + userId + form);
  // if not https, send automatically, otherwise have user click
  /*
  $.get('http://blyph.com/booklist/progress.html', function (data) {
    console.log(data);
    console.log(status);
    $('body').html(data);
  }, 'xml');
  */
  var semesters = [
          "winter"
        , "winterb2"
        , "spring"
        , "summer"
        , "fall"
        , "fallb2"
      ]
    ;

  // this year +1 year or -3 years
  var years = [
      2012
    , 2011
    , 2010
    , 2012
    , 2009
    , 2008
  ]

  var requests = [];
  var allpages = [];

  function requestError() {
    console.error(arguments);
  }

  function scrapeBookList(el) {
    var count = 0
      , id
      , cssClass
      , coursename
      , coursematch
      , materialEls
      , course
      , courses = []
      , materials = []
      ;

    while (true) {
      id = el.attr('id');
      cssClass = el.attr('class');

      // count is effectively the number of classes
      if (0 === el.length || count > 100) {
        break;
      }
      count += 1;

      course = {};
      if ('CourseMaterialTitle' === cssClass) {
        coursename = (el.text()||'').trim();
        console.log('coursename', coursename);
        if (coursematch = coursename.match(/(.*)\s*(Section.*\d+)/)) {
          course.name = coursematch[0];
          course.section = coursematch[1];
        } else {
          course.name = coursename;
        }

        el = el.next();
        id = el.attr('id');
        cssClass = el.attr('class');
      }

      if ('CourseMaterialDiv' === cssClass) {
        materials = [];
        materialEls = el.find('.ItemContainerDiv');
        materialEls.each(function (i, data) {
          var material = {}
            , itemEl = $(data)
            ;;

          if (itemEl.find('.ItemEmpty').length) {
            return;
          }
          material.isbn = $(data).find('.ItemISBNText.Subtext').text().trim();
          material.title = $(data).find('.ItemTitle.Uncompressed').text().trim();
          material.author = $(data).find('.ItemAuthorText.Subtext').text().trim();
          material.newPrice = $(data).find('.BookstorePricingNewPriceText.Subtext').text().trim();
          material.usedPrice = $(data).find('.BookstorePricingUsedPriceText.Subtext').text().trim();
          material.rentalPrice = $(data).find('.BookstorePricingRentalPriceText.Subtext').text().trim();
          material.required = $(data).find('.ItemRequired').text().trim();
          materials.push(material);

          console.log('material.title', material.title);
        });
        course.materials = materials;
      }

      if (course.materials.length) { 
        courses.push(course);
      }
      el = el.next();
    }

    return { courses: courses };
  }

  function requestSuccess(data, status) {
    var head = $(data).find('#buyMyBooksDiv').next()
      , list = {}
      , term
      ;

    try {
      list = scrapeBookList(head);
      if (list.courses.length) {
        allpages.push(list);
      }
    } catch(e) {
      list.error = e;
      console.error(e);
      // TODO
      // send error message to server
    }

    term = this.url.match(/term=(\d+)(\d)/);
    if (term) {
      list.year = term[1];
      list.semester = semesters[term[2] - 1];
      list.term = term[2];
    }
  }

  function requestComplete(xhr) {
    requests.pop();
    loadedLists += 1;
    $("#scrape-progress").attr('value', loadedLists);
    $("#scrape-progress .loaded").html(loadedLists);
    if (!requests.length) {
      alert('finished importing book list (not sent to Blyph)');
      $('#blyphmas').val(JSON.stringify(allpages));
    }
  }

  var totalLists = 1 + years.length * semesters.length
    , loadedLists = 1;
  $("<progress id='scrape-progress' value='" +
      loadedLists + "' max='" +
      totalLists + "'><span class='loaded'>" +
      loadedLists + "</span>/<span class='total'>" + 
      totalLists + "</span>").appendTo("body");

  years.forEach(function (year) {
    semesters.forEach(function (s, i) {
      var request = "/mybooklist?term=" + year + '' + (i + 1);
      
      requests.push(requests);
      $.ajax({
          url: request
        , error: requestError
        , success: requestSuccess
        , complete: requestComplete
      });
    });
  });

  
}());
