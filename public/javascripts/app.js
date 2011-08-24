var ignoreme
    , searchCache = {}
    , searchKeywords = {}
    , userBooks
    , fullBooklist
    , token
    , updateListsG
  ;

(function () {
  "use strict";

  var $ = require('jQuery')
    , Futures = require('futures')
    , request = require('ahr2')
    , CampusBooks = require('campusbooks')
    , ISBN = require('isbn').ISBN
    , display_item_template
    , form_item_template
    , bookinfoHeader =  [
          'isbn'
        , 'age'
        , 'title'
        , 'author'
        , 'binding'
        , 'msrp'
      //, info.pages
        , 'publisher'
        , 'published_date'
        , 'edition'
      //, info.rank
      //, info.rating
        , 'image'
      ];
    ;

  // TODO remove
  window.$ = $;

  // for jeesh / jQuery compat
  $.domReady = $.domReady || $;

  function debug(a, b, c, d) {
    if (console && console.log) {
      console.log(a, b, c, d);
    }
  }

  function saveBooklist() {
    var booklist;
    // TODO figure this the heck out!!! wtf?
    fullBooklist.token = token;
    fullBooklist.student = token;
    fullBooklist.booklist = userBooks;
    fullBooklist.timestamp = new Date().valueOf();
    fullBooklist.type = 'booklist';
    booklist = JSON.stringify(fullBooklist);

    // TODO fix stringify on serverside
    request({
        "method": "POST"
      , "href": "/booklist/" + token
      , "body": { "booklist": booklist }
      // TODO make a shortcut in ahr for this
      , "contentType": "application/json"
      , "headers": {
          "Content-Type": "application/json"
        }
    }).when(function (err, ahr, data) {
      console.log('saveBooklist', err, ahr, data);
    });
  }

  function noop() {}

  function reconstituteBookCache(err, ahr, data) {
    data.forEach(function (b) {
      var book = {}
        ;

      bookinfoHeader.forEach(function(header, i) {
        book[header] = b[i]; 
      });

      searchCache[book.isbn13 || book.isbn10 || book.isbn] = book;
    });

    // now show my list
    $.domReady(listUploads);
  }
  request({
    href: "/bookinfo.table.json"
  }).when(reconstituteBookCache);

  function appendBook(book, i) {
    console.log(book, i);
    var bookhtml = $(display_item_template)
      , isbn
      ;

    isbn = ISBN.parse(book.isbn || book.isbn13 || book.isbn10);

    if (isbn) {
      book.isbn10 = isbn.asIsbn10();
      book.isbn13 = isbn.asIsbn13();
    } else {
      book.isbn = String(book.isbn||'');

      if (13 === book.isbn.length) {
        book.isbn13 = book.isbn;
        book.isbn10 = book.isbn10 || '';
      } else if (10 === book.isbn.length) {
        book.isbn10 = book.isbn;
        book.isbn13 = book.isbn13 || '';
      } else {
        // need some sort of reference
        book.isbn13 = book.isbn;
      }
    }

    discoverBinding(book);

    book.edition = book.edition || '';

    if (/^amz:/.exec(book.image)) {
      book.image = book.image.substr(4);
      book.image = 'http://ecx.images-amazon.com/images/I/' + book.image + '._SL150_.jpg';
    } else if (!/\w+/.exec(book.image)) {
      delete book.image;
    }

    bookhtml.find(".item_picture img").attr('src', book.image).load(function (ev) {
      if (ev.target.height > ev.target.width) {
        $(ev.target).addClass('book-image-tall');
      }
    });
    bookhtml.find(".title").html(truncateTitle(book, 50));
    bookhtml.find(".isbn10").text(book.isbn10);
    bookhtml.find(".isbn13").text(book.isbn13);
    bookhtml.find(".authors").text(book.author);
    bookhtml.find(".edition").text(book.edition);
    bookhtml.find(".course").text((book.courseDept||'').toUpperCase() + ' ' + (book.courseNum||''));
    bookhtml.find(".semester").text((book.termSeason||'').toUpperCase() + ' ' + (book.termYear||''));
    //bookhtml.find(".course").text(book.courseDept);

    $('#item_list').append(bookhtml);
  }

  var bindingRe = [
          /cd/i
        , /dvd/i
        , /pap/i
        , /hard/i
        , /spiral/i
      ]
    ;
  function discoverBinding(book) {
    function bookEd(re) {
      if (re.test(book.edition)) {
        book.binding = book.edition;
        delete book.edition;
      }
    }
    bindingRe.forEach(bookEd);
  }

  var patternEdition = /(.*)(\(.*?edition.*?\))(.*)/i;
  function truncateTitle(book, len) {
    // TODO sanitize inputs
    len = len || 256;

    var title = book.title
      , colon
      , strarr = []
      , match
      ;

    match = title.match(patternEdition);

    // TODO place 'edition' somewhere useful
    if (match && match[2]) {
      title = "";
      title += match[1] || "";
      title += match[3] || "";
      book.edition = book.edition || match[2];
    }

    if (title.length > len) {
      colon = title.lastIndexOf("(");
      if (colon >= 0 && colon < len) {
        strarr[0] = title.substr(0, colon);
        strarr[1] = "<br/>";
        strarr[2] = title.substr(colon);
        title = strarr.join('');
      }
      //
      //title = title.substr(0,len) + '...';
    }

    return title;
  }

  function updateLists() {
    $('.booklist-need-data .booklist-item').remove();
    $('.booklist-have-data .booklist-item').remove();
    $('.booklist-keep-data .booklist-item').remove();

    Object.keys(userBooks).forEach(function (isbn) {
      var book = userBooks[isbn];

      if (false === book.haveIt && true === book.wantIt) {
        $('.booklist-need-data ul').append("<li class='booklist-item'>" + book.title + "</li>");
      } else if (true === book.haveIt && false === book.wantIt) {
        $('.booklist-have-data ul').append("<li class='booklist-item'>" + book.title + "</li>");
      } else if (true === book.haveIt && true === book.wantIt) {
        $('.booklist-keep-data ul').append("<li class='booklist-item'>" + book.title + "</li>");
      }
    });
  }
  updateListsG = updateLists;

  function create(app) {
    function slowKeyup(wait, getData, shouldWait, cb) {
      var key_timeout = 0
        , ignore_me = false
        , lastData
        ;

      return {
        keyup: function (ev) {
          console.log(arguments);
          ev.preventDefault();

          if (ignore_me) {
            ignore_me = false;
            return;
          }

          var data = getData();
          if (lastData === data) {
            return;
          }
          lastData = data;

          clearTimeout(key_timeout);
          if (shouldWait(data)) {
            key_timeout = 0;
            cb(data);
          } else {
            key_timeout = setTimeout(cb, wait, data);
          }
        },
        submit: function (ev) {
          ev.preventDefault();
          clearTimeout(key_timeout);

          var data = getData();
          if (lastData === data) {
            return;
          }
          lastData = data;

          ignore_me = true;
          cb(data);
        }
      };
    }
    (function () {
  /*
    app.onSearch($("#search").val(), noop);
    $("body").delegate("form#search_form", "submit", function (ev) {
      ev.preventDefault();
    });
  */

      function match(data) {
        if (!data.match(/\w$/) && data.length >= 5) {
          return true;
        }
        return false;
      }

      function pre() {
        return $("#search").val();
      }

      function doStuff(data) {
        debug("submit: " + data);
        app.onSearch(data, noop);
      }

      var respondon = slowKeyup(500, pre, match, doStuff);
      $("body").delegate("#search", "keyup", respondon.keyup);
      $("body").delegate("form#search_form", "submit", respondon.submit);
    }());
  }

  function escapeRegExp(str) {
    return str.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  var punctRe = /[\.\-_'":!\$\?]/g;
  function searchInCache(title) {
    var results = []
      , pattern
      ;

    title = (title||'').replace(punctRe, '');
    pattern = new RegExp('\\b' + escapeRegExp(title), 'i');

    if (pattern.exec('zzzzz')) {
      return [];
    }

    Object.keys(searchCache).forEach(function (isbn) {
      // TODO romanize titles (as does mediabox)
      var book = searchCache[isbn]
        , title = (book.title||'').replace(punctRe, '')
        ;

      if (pattern.exec(title)) {
        results.push(book);
      }
    });

    return results.slice(0, 10);
  }

  var patternToken = /(?:\?|&)token=(.*?)(?:&|$)/;
  var patternIsbn = /\d{10}|\d{13}/;
  function run() {
      // This key is a special dummy key from CampusBooks for public testing purposes 
      // Note that it only works with Half.com, not the other 20 textbook sites, 
      // so it's not very useful, but good enough for this demo
    var campusbooks = CampusBooks.create("BDz21GvuL6RgTKiSbwe3")
      //, display_item_template = $("#item_list").html()
      ;

    create({
      onSearch: function (input) {
        var isbn
          , isbnText
          , opts = {}
          , searchType
          , results
          ;

        function onCbSearchComplete(err, xhr, data) {
          var books
            , error
            , now = new Date().valueOf()
            ;

          books = data 
              && data.response 
              && data.response.page 
              && data.response.page.results 
              && data.response.page.results.book
              || undefined;

          if ('bookinfo' === searchType) {
            books = data 
                && data.response 
                && data.response.page
                || undefined;
          }

          books = books && (Array.isArray(books) ? books : [books]);

          error = err || data && data.repsonse && data.response.errors;

          if (error) {
            // TODO unobtrusive alert('params: ' + JSON.stringify(params));
            debug("something erred", error);
            return;
          }

          if (!books) {
            books = [];
            debug("missing data", data);
            return;
          } else {
            searchKeywords[input] = data;
          }

          function cacheBook(book) {
            searchCache[book.isbn13||book.isbn10] = book;
            book.timestamp = new Date().valueOf();
          }

          books.forEach(cacheBook);


          onSearchComplete(err, books);
        }

        function onSearchComplete(err, books) {
          $("div.item").remove();
          if (!err && Array.isArray(books)) {
            books.forEach(appendBook);
            $("#item_list .book_course").hide();
            $("#item_list .semester").hide();
          }
        }

        input = String(input||'').toLowerCase().trim();

        if (!input || !input.length >= 3) {
          onSearchComplete(null, []);
          return;
        }

        isbnText = input.replace(/[\s\.\-_]/g, '');
        isbn = ISBN.parse(isbnText);

        if (isbn || patternIsbn.exec(isbnText)) {
          opts.isbn = isbnText;
          searchType = 'bookinfo';
          results = searchCache[isbnText];
          results = results && [results];
        } else {
          opts.title = input;
          searchType = 'search'
          // TODO search school cache
        }

        // TODO merge in both results
        results = results || searchKeywords[input] || searchInCache(input);

        // 150px seems a good size
        opts.image_height = 150;

        if (!results || !results.length) {
          campusbooks[searchType](opts).when(onCbSearchComplete);
        } else {
          onSearchComplete(null, results);
        }
      }
    });
  }

  function listUploads() {
    var books
      , unsorted = []
      , ISBN = require('isbn').ISBN
      ;

    function display() {
      Object.keys(books).forEach(function (isbn, i) {
        var book = books[isbn];

        if ('undefined' === typeof book.haveIt || 'undefined' === typeof book.wantIt) {
          unsorted.push(book);
        }
      });

      unsorted.sort(function (a, b) {
        // chorological (future -> past)
        if (a.term !== b.term) {
          return a.term < b.term;
        }
        // alphabetical (a -> z)
        return a.title.toUpperCase() > b.title.toUpperCase();
      });

      //unsorted.forEach(appendBook);
      unsorted.forEach(function (book, i) {
        try {
          appendBook(book, i);
        } catch(e) {
          console.error('TODO', e, book);
        }
      });

      $("#item_list .button-list2").hide();
      $("#item_list .button-want2").hide();

      transitionBookList();
    }

    // http://localhost:3080
    request({
        href: "/booklist/" + token + "?_no_cache_=" + new Date().valueOf()
    /*
      , headers: {
            "X-User-Session": "badSession"
        }
    */
    }).when(function (err, ahr, data) {
        if (err) {
          console.error(err);
          alert(JSON.stringify(err));
          return;
        }

        console.log('token');
        console.log('arguments: ', err, ahr, data);
        fullBooklist = data;
        books = userBooks = data.booklist;

        // TODO this may chance to happen before
        // the bookinfo.table.json is loaded
        Object.keys(books).forEach(function (isbn) {
          var book = books[isbn]
            , bookinfo = searchCache[book.isbn13 || book.isbn10 || book.isbn]
            ;

          if (bookinfo) {
            book.image = bookinfo.image;
            book.author = bookinfo.author || book.author;
            book.isbn13 = bookinfo.isbn13;
            book.isbn10 = bookinfo.isbn10;
            book.edition = bookinfo.edition;
            book.binding = bookinfo.binding;
            book.title = bookinfo.title || book.title;
          }
        });

        display();
        updateLists();
    });
  }

  function transitionBookList() {
    if (!$('.item') || !$('.item').length) {
      $('#list-button-container').fadeOut();
      $('#searchbar').slideDown();
    }
  }

  function addBook(bookEl, haveIt, wantIt) {
    var isbn10 = bookEl.find('.isbn10').text().trim()
      , isbn13 = bookEl.find('.isbn13').text().trim()
      , myBook = userBooks[isbn13] || userBooks[isbn10]
      , book = searchCache[isbn13] || searchCache[isbn10]
      ;

    if (myBook) {
      // TODO
      myBook.image = book.image;
    } else {
      myBook = userBooks[isbn13||isbn10] = book;
    }

    if (!myBook) {
      if (isbn13 || isbn10) {
        alert('TODO: local search book info \n' + bookEl.text());
        return;
      }

    }

    myBook.haveIt = haveIt;
    myBook.wantIt = wantIt;

    bookEl.addClass('slide-up');
	setTimeout(function () {
        transitionBookList();
        bookEl.remove();
	}, 500);
    updateLists();
    saveBooklist();
  }

  function updateBook(bookEl, haveIt, wantIt) {
    var isbn10 = bookEl.find('.isbn10').text().trim()
      , isbn13 = bookEl.find('.isbn13').text().trim()
      , book = userBooks[isbn13] || userBooks[isbn10]
      ;

    if (!book) {
      if (isbn13 || isbn10) {
        alert('TODO: cache book info \n' + bookEl.text());
        return;
      }

    }

    book.haveIt = haveIt;
    book.wantIt = wantIt;

    bookEl.addClass('slide-up');
	setTimeout(function () {
        transitionBookList();
        bookEl.remove();
	}, 500);
    updateLists();
    saveBooklist();
  }

  //$.domReady(run);
  $.domReady(function () {
    display_item_template = $("#item_list").html();
    form_item_template = $("#item_form").html()

    token = patternToken.exec(location.hash);
    token = token && token[1];

    location.hash = '';

    while (!token) {
      token = prompt('Your Email Address:');
    }

    $("div.item").remove();
    $("div.change_item").remove();
  });

  $.domReady(function () {
    $('body').delegate('.button-want', 'click', function (ev) {
      updateBook($($('.item')[0]), false, true);
    });
    $('body').delegate('.button-list', 'click', function (ev) {
      updateBook($($('.item')[0]), true, false);
    });
    $('body').delegate('.button-keep', 'click', function (ev) {
      updateBook($($('.item')[0]), true, true);
    });
    $('body').delegate('.button-ignore', 'click', function (ev) {
      updateBook($($('.item')[0]), false, false);
    });

    $('body').delegate('.button-want2', 'click', function (ev) {
      addBook($($('.item')[0]), false, true);
    });
    $('body').delegate('.button-list2', 'click', function (ev) {
      addBook($($('.item')[0]), true, false);
    });
  });

  $.domReady(run);
}());
