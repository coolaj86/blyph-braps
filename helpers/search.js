function search(regex) {
  data.forEach(function (book) {
    var matches = false;
    book.forEach(function (attr) {
      var x = String(attr);

      if (x.match(regex)) {
        matches = true;
      }
    });
    if (matches) {
      console.log(book);
    }
  });
}
