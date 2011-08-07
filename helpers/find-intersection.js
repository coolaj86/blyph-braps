(function () {
  "use strict";

  var fs = require('fs')
    , byuList = JSON.parse(fs.readFileSync('./byu-isbns.json'))
    , uvuList = JSON.parse(fs.readFileSync('./uvu-isbns.json'))
    , intersectCount = 0
    , isbnMap = {}
    ;

  byuList.forEach(function (isbn) {
    isbnMap[isbn] = true;
  });
  uvuList.forEach(function (isbn) {
    if (isbnMap[isbn]) {
      intersectCount += 1;
      console.log(intersectCount);
    }
  });
}());
