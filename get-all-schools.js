// http://www.utexas.edu/world/univ/alpha/
var urls = {};
[].slice.call($$('a.institution')).forEach(function (el) {
  var url = el.href.replace(/.*\/\/(www2?\.)?([^\/]+).*/, '$2')
    , name = el.innerHTML
    ;

  /*
  if (/\..*\./.test(url)) {
    console.log(url);
  }
  if (!/\.edu|\.mil|\.gov/.test(url)) {
    console.log(url);
  }
  */
  
  urls[url] = true;
});
urls = Object.keys(urls).sort();
JSON.stringify(urls, null, '  ');
