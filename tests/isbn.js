(function () {
  var isbn = require('isbn').ISBN;

  console.log(isbn);
  console.log(isbn.parse('1-933988-03-7').isIsbn10());
  console.log(isbn.parse('978-4-87311-336-4').isIsbn10());
  if (!isbn.parse('1234567890') {
    // NOT an ISBN
  }
}());
