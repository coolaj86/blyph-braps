//
// User must login:
// https://uvlink.uvu.edu/cp/home/displaylogin
//
// User must navigate to the booklist:
// https://uvlink.uvu.edu/cp/ip/login?sys=gencpip&url=https://uvu.edu/bookstore/bookmatch.php?connId=place
//
// User must copy and paste script into url bar
// javascript:(var s=document.createElement('script'),sc=document.getElementsByTagName("body")[0] || document.getElementsByTagName("head")[0];s.src="http://blyph.com/booklist/uvu.js");
(function () {
  "use strict";

  var jqScript = document.createElement('script')
    , scriptContainer = document.getElementsByTagName("body")[0] || document.getElementsByTagName("head")[0]
  //, $
    ;

  function jqFailed() {
    alert('Error + failed to load jQuery. Please call 317-426-6525 and let AJ know about this problem');
  }

  function onBooklist(data, status, xhr) {
    console.log('booklist', arguments);
  }

  function scrape() {
    // this has a very very very weird double table thing going on...
    var tables = [];
    //$ = jQuery;
    //console.log('scrape', arguments);
    // $('#ctl00_ContentPlaceHolder1_Datalist1')
    // $("#ctl00_ContentPlaceHolder1_Datalist1").find('table');
    $("#ctl00_ContentPlaceHolder1_Datalist1").find('table').each(function (i, data) {
      var id = $(data).attr('id');
      console.log(id);
      if (!id) {
        tables.push(data);
      }
    });
  }

  jqScript.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.js";
  jqScript.onload = scrape;
  jqScript.onerror = jqFailed;
  scriptContainer.appendChild(jqScript);
}());
