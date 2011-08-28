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
    , MD5 = require('md5')
    , Join = require('join')
    , hasImportedList = false
    , Futures = require('futures')
    , request = require('ahr2')
    , CampusBooks = require('campusbooks')
    , campusbooks = CampusBooks.create("BDz21GvuL6RgTKiSbwe3")
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

  function sortBySemester(a, b) {
    var year
      , term
      ;
    // chorological (future -> past)
    if (a.termYear !== b.termYear) {
      return (parseInt(a.termYear) > parseInt(b.termYear)) ? -1 : 1;
    }
    if (a.term !== b.term) {
      return (parseInt(a.term) < parseInt(b.term)) ? -1 : 1;
    }

    // alphabetical (a -> z)
    return a.title.toUpperCase() > b.title.toUpperCase();
  }

  // TODO be efficient-ish
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

      searchCache[book.isbn13 || book.isbn || book.isbn10] = book;
    });

    // now show my list
    $.domReady(listUploads);
  }
  request({
    href: "/bookinfo.table.json"
  }).when(reconstituteBookCache);


  var tradersTpl;
  function showTraders(traders) {
    var tradersArea = $('#person-matches ul');

    if (!tradersTpl) {
      tradersTpl = $('#person-matches ul').html();
    }

    tradersArea.find('li').remove();

    traders.forEach(function (trader) {
      // TODO calculate name and gravatar server-side (use as token?)
      var traderHtml = $(tradersTpl)
        , name = trader.token.replace(/\s*@.*/, '').toLowerCase()
        , gravatar = MD5.digest_s(trader.token.trim().toLowerCase())
        , price = Number(trader.fairest_price)
        ;

      if (price) {
        price = '$' + Math.round(price);
      } else {
        price = 'Make Offer';
      }

      console.log('showTrader', trader, MD5.digest_s(trader.token.trim().toLowerCase()));
      traderHtml.find('.result-name').text(name);

      traderHtml.find('.result-for-price').text(price);
      traderHtml.find('.person-or-store img').attr('src', 'http://www.gravatar.com/avatar/' + gravatar + '?s=50&r=pg&d=identicon');
      tradersArea.append(traderHtml);
    });
  }

  var onlineStoresTpl;
  function showConsumers(consumers) {
    var storesArea = $('#online-matches ul');

    $('#matches').show();

    if (!onlineStoresTpl) {
      onlineStoresTpl = $('#online-matches ul').html();
    }
    
    storesArea.find('li').remove();

    consumers.online.forEach(function (consumer) {
      var onlineStores;
      onlineStores = $(onlineStoresTpl);
      onlineStores.find('.person-or-store img').attr('src', consumer.merchant_image);
      onlineStores.find('.result-name').html(consumer.name);
      onlineStores.find('.ols-buy-sell')
        .text('Sell My Book Here')
        .attr('href', consumer.link)
        ;
      onlineStores.find('.result-for-price').html('$' + consumer.prices.sort()[0]);
      storesArea.append(onlineStores);
      console.log('appendConsumer', consumer);
    });
  }
  function showProviders(providers) {
    var storesArea = $('#online-matches ul');

    $('#matches').show();

    if (!onlineStoresTpl) {
      onlineStoresTpl = $('#online-matches ul').html();
    }
    
    storesArea.find('li').remove();

    providers.online.forEach(function (provider) {
      provider.total_price = Number(provider.total_price);
      provider.price = Number(provider.price);
    });
    providers.online.sort(function (a, b) {
      return a.total_price < b.total_price ? -1 : 1;
    });
    providers.online.forEach(function (provider) {
      console.log('appendProvider', provider);
      var onlineStores;
      onlineStores = $(onlineStoresTpl);
      onlineStores.find('.person-or-store img').attr('src', provider.merchant_image);
      onlineStores.find('.result-name').html(provider.merchant_name);
      onlineStores.find('.ols-buy-sell')
        .text('Buy My Book Here')
        .attr('href', provider.link)
        ;
      if (7 === Number(provider.condition_id)) {
        onlineStores.find('.ols-edition').text('Int\'l Edition')
      }
      onlineStores.find('.result-for-price').html('$' + Number(provider.total_price).toFixed(2));
      storesArea.append(onlineStores);
    });
  }

  function showBooks(books) {
    $('#matches').hide();
    $('#imported-booklist .item').remove();
    books.forEach(appendBook);
  }
  function showBook(book) {
    var count = 0;
    showBooks([book]);

    // Find the Fair Price, if Possible
    book.fairest_price = 0;
    if (book.highest_buyback_price > 0 && book.highest_buyback_price < Infinity) {
      count += 1;
      book.fairest_price += book.highest_buyback_price;
    }
    if (book.lowest_buy_price > 0 && book.lowest_buy_price < Infinity) {
      count += 1;
      book.fairest_price += book.lowest_buy_price;
    }
    if (count) {
      book.fairest_price /= count;
    }
    if (!book.fairest_price) {
      delete book.fairest_price;
    }
    console.log('fair_price', book.fairest_price);

    // 
    console.log('showBook');
    if (book.wantIt && !book.haveIt && book.providers) {
      // TODO get lowest used price
      console.log('showProviders');
      showProviders(book.providers());
      showTraders(book.providers().trade.concat(book.participants()));
    }
    if (!book.wantIt && book.haveIt && book.consumers) {
      // TODO get highest buyback price
      console.log('showConsumers');
      showConsumers(book.consumers());
      showTraders(book.consumers().need.concat(book.participants()));
    }
  }

  // TODO needs all four options
  function appendBook(book, i) {
    var bookhtml = $(display_item_template)
      , isbn
      ;

    isbn = ISBN.parse(book.isbn13 || book.isbn || book.isbn10);

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

    function onImageLoad(ev) {
      if (ev.target.height > ev.target.width) {
        $(ev.target).addClass('book-image-tall');
      }
    };
    var image = bookhtml.find(".item_picture img").attr('src', book.image);
    if (image.load) {
      image.load(onImageLoad);
    }
    bookhtml.find(".item_picture img").attr('src', book.image).onload = 
    bookhtml.find(".title").html(truncateTitle(book, 50));
    bookhtml.find(".isbn10").text(book.isbn10);
    bookhtml.find(".isbn13").text(book.isbn13);
    bookhtml.find(".authors").text(book.author);
    bookhtml.find(".edition-data").text(book.edition || '?');
    bookhtml.find(".course").text((book.courseDept||'').toUpperCase() + ' ' + (book.courseNum||''));
    bookhtml.find(".semester").text((book.termSeason||'').toUpperCase() + ' ' + (book.termYear||''));
    //bookhtml.find(".course").text(book.courseDept);

    $('#imported-booklist').append(bookhtml);
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

  var booklistItemTpl;
  function templateBooklistItem(book) {
    var item = $(booklistItemTpl);
    item.find('.bli-title').html(book.title);
    item.find('.bli-isbn').html(book.isbn);
    return item;
  }
  function updateLists() {
    if (!booklistItemTpl) {
      booklistItemTpl = $('.booklist-need-data ul')[0].innerHTML;
    }
    
    $('.booklist-unsorted-data .booklist-item').remove();
    $('.booklist-need-data .booklist-item').remove();
    $('.booklist-have-data .booklist-item').remove();
    $('.booklist-keep-data .booklist-item').remove();

    Object.keys(userBooks).forEach(function (isbn) {
      var book = userBooks[isbn]
        ;

      book.isbn = isbn;

      if (false === book.haveIt && true === book.wantIt) {
        $('.booklist-need-data ul').append(templateBooklistItem(book));
      } else if (true === book.haveIt && false === book.wantIt) {
        $('.booklist-have-data ul').append(templateBooklistItem(book));
      } else if (true === book.haveIt && true === book.wantIt) {
        $('.booklist-keep-data ul').append(templateBooklistItem(book));
      } else if (false === book.haveIt && false === book.wantIt) {
        // do nothing
      } else {
        $('.booklist-unsorted-data ul').append(templateBooklistItem(book));
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
        console.log("submit: " + data);
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
    //var campusbooks = CampusBooks.create("BDz21GvuL6RgTKiSbwe3")
      //, display_item_template = $("#imported-booklist").html()
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
            console.error("something erred", error);
            return;
          }

          if (!books) {
            books = [];
            console.warn("missing data", data);
            return;
          } else {
            searchKeywords[input] = data;
          }

          function cacheBook(book) {
            searchCache[book.isbn13||book.isbn||book.isbn10] = book;
            book.timestamp = new Date().valueOf();
          }

          books.forEach(cacheBook);


          onSearchComplete(err, books);
        }

        function onSearchComplete(err, books) {
          //$("div.item").remove();
          if (!err && Array.isArray(books)) {
            showBooks(books);
            //books.forEach(appendBook);
            $("#imported-booklist .book_course").hide();
            $("#imported-booklist .semester").hide();
            $("#imported-booklist .button-ignore2").hide();
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

      unsorted.sort(sortBySemester);

      //unsorted.forEach(appendBook);
      unsorted.forEach(function (book, i) {
        try {
          appendBook(book, i);
        } catch(e) {
          console.error('TODO', e, book);
        }
      });


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

        fullBooklist = data;
        books = userBooks = data.booklist || {};

        // TODO this may chance to happen before
        // the bookinfo.table.json is loaded
        Object.keys(books).forEach(function (isbn) {
          var book = books[isbn]
            , bookinfo = searchCache[book.isbn13 || book.isbn || book.isbn10]
            ;

          if (bookinfo) {
            book.image = bookinfo.image;
            book.author = bookinfo.author || book.author;
            book.isbn13 = bookinfo.isbn13 || book.isbn13;
            book.isbn10 = bookinfo.isbn10 || book.isbn10;
            book.edition = bookinfo.edition;
            book.binding = bookinfo.binding;
            book.title = bookinfo.title || book.title;
          }
          book.isbn = book.isbn13 || book.isbn || book.isbn10;

          if (book.term) {
            hasImportedList = true;
          }
        });

        if (hasImportedList) {
          $('#import-prompt').remove();
        }
        display();
        updateLists();
    });
  }

  function transitionBookList() {
    if (!$('.item') || !$('.item').length) {
      $('#list-button-container').fadeOut();
      $('.autoloader').fadeOut();
      if (hasImportedList) {
        $('#import-prompt').remove();
      }
    }
  }

  // TODO move to a campusbooks wrapper library
  function cbPrices(data) {
    var list = []
      , conditions
      ;

    // XML is so fupt...
    conditions = data 
              && data.response 
              && data.response.page 
              && data.response.page.offers 
              && data.response.page.offers.condition
              || []
              ;

    conditions = Array.isArray(conditions) ? conditions : [conditions];
    conditions.forEach(function (offers) {
      offers = offers.offer;
      if (!offers) {
        offers = [];
      }
      offers = Array.isArray(offers) ? offers : [offers];
      offers.forEach(function (offer) {
        list.push(offer);
      });
    });
    return list;
  }
  function cbBuyBackPrices(data) {
    var merchants
      ;

    // XML is so fupt...
    merchants = data 
              && data.response 
              && data.response.page 
              && data.response.page.offers 
              && data.response.page.offers.merchant
              || []
              ;

    merchants = Array.isArray(merchants) ? merchants : [merchants];
    merchants.forEach(function (merchant) {
      merchant.prices = merchant.prices.price;
    });

    return merchants;
  }

  function getProviders(book) {
    var join = Join()
      , isbn = book.isbn13 || book.isbn || book.isbn
      ;

    campusbooks.prices({isbn: isbn}).when(join.add());
    request({
      "href": "/books/byTrade/" + isbn
    }).when(join.add());
    request({
      "href": "/books/byUnsorted/" + isbn
    }).when(join.add());

    join.when(function (online, trade) {
      var data = {}
        , lowest
        ;

      data.timestamp = new Date().valueOf();
      data.online = cbPrices(online[2]).filter(function (offer) { return 6 !== parseInt(offer.condition_id) });
      data.trade = trade[2] && trade[2].books || [];

      data.online.sort(function (a, b) {
        if (a.total_price && b.total_price) {
          return parseFloat(a.total_price) < parseFloat(b.total_price) ? -1 : 1;
        }

        return parseFloat(a.price) < parseFloat(b.price);
      });
      lowest = data.online[0] || { price: Infinity, total_price: Infinity };

      // prevent JSON send
      // TODO realize that this is the bookstore price
      // and give them credit if they're the best (not likely)
      book.usedPrice = parseFloat(book.usedPrice) || Infinity;
      book.lowest_buy_price = Math.min(book.usedPrice, lowest.total_price || lowest.price);
      console.log('lowest_buy_price_debug', book, book.lowest_buy_price);

      book.providers = function () {
        return data;
      };

      // show matched icon
      updateLists();
    });
  }
  function getConsumers(book) {
    var join = Join()
      , isbn = book.isbn13 || book.isbn || book.isbn
      ;

    campusbooks.buybackprices({isbn: isbn}).when(join.add());
    request({
      "href": "/books/byNeed/" + isbn
    }).when(join.add());
    request({
      "href": "/books/byUnsorted/" + isbn
    }).when(join.add());

    join.when(function (online, need) {
      var data = {}
        ;

      data.timestamp = new Date().valueOf();
      data.online = cbBuyBackPrices(online[2]);
      data.need = need[2].books || [];

      data.online.sort(function (o0, o1) {
        var a, b;
        a = parseFloat(o0.prices.sort().reverse()[0], 10)||0;
        b = parseFloat(o1.prices.sort().reverse()[0], 10)||0;
        return a > b ? -1 : 1;
      });

      book.highest_buyback_price = parseFloat(((data.online[0]||{}).prices||[]).sort().reverse()[0]||0, 10);
      console.log('highest_buyback_price_debug', book, book.highest_buyback_price);

      // prevent JSON send
      book.consumers = function () {
        return data;
      };
      window.gotConsumers = {
          online: data.online
        , need: data.need
      };

      // show matched icon
      updateLists();
    });
  }
  function getParticipants(book) {
    var join = Join()
      , isbn = book.isbn13 || book.isbn || book.isbn
      ;

    request({
      "href": "/books/byUnsorted/" + isbn
    }).when(join.add());

    join.when(function (unsorted) {
      var data = {}
        ;

      data.timestamp = new Date().valueOf();
      data.unsorted = unsorted[2].books || [];

      // prevent JSON send
      book.participants = function () {
        return data.unsorted;
      };

      console.log('gotParticipants');
      updateLists();
    });
  }

  function addBook(bookEl, haveIt, wantIt) {
    var isbn10 = bookEl.find('.isbn10').text().trim()
      , isbn13 = bookEl.find('.isbn13').text().trim()
      , myBook = userBooks[isbn13] || userBooks[isbn10]
      , book = searchCache[isbn13] || searchCache[isbn10]
      ;

    // TODO move this elsewhere
    $('#matches').hide();

    // TODO where did searchCache go?
    if (book) {
      if (myBook) {
        // TODO
        myBook.image = book.image;
      } else {
        myBook = userBooks[isbn13||isbn10] = book;
      }
    }

    myBook.haveIt = haveIt;
    myBook.wantIt = wantIt;
    if ((haveIt & !wantIt) || (!haveIt & wantIt)) {
      if (!myBook.consumers) {
        getConsumers(myBook);
      }
      if (!myBook.providers) {
        getProviders(myBook);
      }
      if (!myBook.participants) {
        getParticipants(myBook);
      }
    }

    bookEl.addClass('slide-up');
    setTimeout(function () {
      bookEl.remove();
      transitionBookList();
	  }, 500);
    updateLists();
    saveBooklist();
  }

  //$.domReady(run);
  $.domReady(function () {
    display_item_template = $("#imported-booklist").html();
    form_item_template = $("#item_form").html()

    token = patternToken.exec(location.hash);
    token = token && token[1];

    location.hash = '';

    if (!token) {
      token = localStorage.getItem('token');
    }
    while (!token) {
      token = prompt('Your Email Address:');
    }
    localStorage.setItem('token', token);

    setTimeout(function () {
      var href = $(".load-booklist a").attr('href');
      $(".load-booklist a").attr('href', href + '#/?token=' + token);
    }, 100);

    $("div.item").remove();
    $("div.change_item").remove();
  });

  $.domReady(function () {
    $('body').delegate('.button-want2', 'click', function (ev) {
      ev.stopPropagation();
      addBook($(this).closest('.item'), false, true);
    });
    $('body').delegate('.button-list2', 'click', function (ev) {
      ev.stopPropagation();
      addBook($(this).closest('.item'), true, false);
    });
    $('body').delegate('.button-keep2', 'click', function (ev) {
      ev.stopPropagation();
      addBook($(this).closest('.item'), true, true);
    });
    $('body').delegate('.button-ignore2', 'click', function (ev) {
      ev.stopPropagation();
      addBook($(this).closest('.item'), false, false);
    });

    $('body').delegate('a.logout', 'click', function (ev) {
      // TODO
      localStorage.removeItem('token');
    });

    $('body').delegate('.booklist-item', 'click', function (ev) {
      ev.stopPropagation();

      var isbn = $(this).find('.bli-isbn').text().trim()
        , book = userBooks[isbn]
        ;

      showBook(book);
    });
    $('body').delegate('.booklist_container', 'click', function (ev) {
      ev.stopPropagation();

      var books = []
        , isbnEls = $(this).find('.bli-isbn')
        , i
        ;

      function getEachIsbn(el) {
        var isbnEl = el
          , isbn = isbnEl && isbnEl.innerHTML
          , book
          ;

        isbn = isbn.trim();
        book = userBooks[isbn];

        if (book) {
          books.push(book);
        }
      }

      for (i = 0; i < isbnEls.length; i += 1) {
        getEachIsbn(isbnEls[i]);
      }

      books.sort(sortBySemester);
      showBooks(books);
    });
    $('body').delegate('.booklist_container header', 'mouseover', function (ev) {
      $(this).closest('.booklist_container').addClass('booklist_container-whole');
    });
    $('body').delegate('.booklist_container header', 'mouseout', function (ev) {
      $(this).closest('.booklist_container').removeClass('booklist_container-whole');
    });

    $('#person-matches').delegate('.ppl-write-message', 'click', function (ev) {
      var personHtml = $(this).closest('.ppl-widget')
        , msg = {}
        ;

      // There should only be one book displayed at a time
      msg.bookTitle = $('#imported-booklist .item .title').text().trim();
      msg.toName = personHtml.find('.result-name').text().trim();
      msg.fairPrice = personHtml.find('.result-for-price').text().trim();

      msg.body = personHtml.find('textarea').val();

      if (msg.toName) {
        msg.body = msg.body.replace(/@NAME/, msg.toName);
      }
      if (msg.bookTitle) {
        msg.body = msg.body.replace(/@TITLE/, msg.bookTitle);
      }
      if (Number(msg.fairPrice.substr(1))) {
        msg.body = msg.body.replace(/@USD/, msg.fairPrice);
      }

      personHtml.find('textarea').val(msg.body);

      $(this).find('.ppl-message').show();
      $(this).find('.button-get-it').hide();
    });


    $('#person-matches').delegate('.ppl-send-message', 'click', function (ev) {
      var personHtml = $(this).closest('.ppl-widget')
        , message = {}
        ;

      message.to = personHtml.find('input.email').val();
      message.from = token;
      message.body = personHtml.find('textarea').val();
      message.fairPrice = personHtml.find('.result-for-price').text().trim();

      request({
          method: "POST"
        , href: "/match"
        , headers: {
              "Content-Type": "application/json"
          }
        , body: message
      }).when(function (err, ahr, data) {
        if (ahr.status >= 200 && ahr.status < 300 && data && !data.error ) {
          alert('Message sent. :-D');
        } else {
          alert('Error: failed to send message');
        }
      });
    });
  });

  $.domReady(run);
}());
