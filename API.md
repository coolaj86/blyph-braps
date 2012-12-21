# API

  POST /subscribe
    * -d '{ "email": "john.doe@gmail.com", "school": "uuu.edu" }'

  PUT /unsubscribe
    finds user by `req.body.userToken` and then adds `doNotMail = true` to their object

  GET /schools
    returns a list of all known schools

  GET /books/:bySort/:isbn
    * finds all books in entire database by `req.params.isbn` in the category `:bySort`
    * bySort - one of 'byTrade', 'byNeed', 'byUnsorted', 'byIgnore', 'byKeep'
    * isbn - the 10 or 13 digit isbn

  GET /booklist/:userToken
  POST /booklist/:userToken
    * userToken can be email or MD5(email)

  POST /match
