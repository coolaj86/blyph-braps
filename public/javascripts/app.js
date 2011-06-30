$(function () {
  function debug(a, b, c, d) {
    if (console && console.log) {
      console.log(a, b, c, d);
    }
    if ($ && $.jGrowl) {
      $.jGrowl.apply(null, arguments);
    } 
  }

  function loadCss(module) {
    var link = document.createElement("link");

    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href", "http://cdn.coolaj86.info/css/" + module + ".css");
  }

  function loadJs(module, cb) {
    var head= document.getElementsByTagName('head')[0],
      script= document.createElement('script'),
      done = false;

    script.onreadystatechange = function () {
      if (this.readyState == 'complete') {
        done || cb();
      }
    }
    script.onload = function () {
      done || cb();
    };
    script.src = 'http://cdn.coolaj86.info/js/' + module + '.js';
    head.appendChild(script);
  }

  function noop() {}

  function create(app) {
    function slowKeyup(wait, getData, shouldWait, cb) {
      var key_timeout = 0,
        ignore_me = false;
      return {
        keyup: function (ev) {
          console.log(arguments);
          ev.preventDefault();

          if (ignore_me) {
            ignore_me = false;
            return;
          }

          var data = getData();

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

  function run() {
    var CampusBooks = require('campusbooks'),
      // This key is a special dummy key from CampusBooks for public testing purposes 
      // Note that it only works with Half.com, not the other 20 textbook sites, 
      // so it's not very useful, but good enough for this demo
      campusbooks = CampusBooks.create("BDz21GvuL6RgTKiSbwe3"),
      display_item_template = $("#item_list").html(),
      form_item_template = $("#item_form").html();

    $("div.item").remove();
    $("div.change_item").remove();

    create({
      onSearch: function (input, cb) {
        debug('onSearch ' + input);
        campusbooks.search({
          image_height: 150,
          title: input
        }).when(function (err, xhr, data) {
          var books;
          debug("result");

          $("div.item").remove();
          if (!(data && data.response && data.response.page && data.response.page.results && data.response.page.results.book)) {
            debug("missing data");
            return;
          }
          if (err || data && data.repsonse && data.response.errors) {
            debug("something errorred");
            // TODO unobtrusive alert('params: ' + JSON.stringify(params));
            return;
          }

          function discoverBinding(book) {
            [
              /cd/i,
              /dvd/i,
              /pap/i,
              /hard/i,
              /spiral/i
            ].forEach(function (re) {
              if (re.test(book.edition)) {
                book.binding = book.edition;
                delete book.edition;
              }
            });
          }

          function truncateTitle(book, len) {
            // TODO sanitize inputs
            len = len || 256;

            var title = book.title,
              colon,
              strarr = [],
              match;
            match = title.match(/(.*)(\(.*?edition.*?\))(.*)/i)
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

          books = data.response.page.results.book;
          //debug(JSON.stringify(books));
          books.forEach(function (book) {
            var bookhtml = $(display_item_template);
            discoverBinding(book);
            bookhtml.find(".item_picture img").attr('src', book.image);
            bookhtml.find(".title").html(truncateTitle(book, 50));
            bookhtml.find(".isbn_10").text("ISBN10: " + book.isbn10);
            bookhtml.find(".isbn_13").text("ISBN13: " + book.isbn13);
            bookhtml.find(".authors").text(book.author);
            bookhtml.find(".edition").text(book.edition);
            $("#item_list").append($(bookhtml));
          });
          cb([
            {
              name: "My Book"
            },
            {
              name: "My Othern Book"
            }
          ]);
        });
      }
    });
  }

  loadCss('jquery.jgrowl');
  loadJs('futures', function () {
    // TODO join.add() returns deliverer
    var Join = require('futures/join'),
      join = Join();

    loadJs('jquery.jgrowl', join.deliverer());
    loadJs('campusbooks', join.deliverer());
    join.when(function () {
      debug('All loaded');
      run();
    });
  });
});
