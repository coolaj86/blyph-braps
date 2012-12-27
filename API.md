# API

The current API, bugs, security holes, and all.

## POST /subscribe

example:

    {
        "email": "john.doe@gmail.com"
      , "school": "uuu.edu"
    }

## PUT /unsubscribe

    finds user by `req.body.userToken` and then adds `doNotMail = true` to their object

example:

    {
        "userToken": "<<md5(email)>>"
    }

## GET /schools

    returns a list of all known schools

example:

    { "success": true, "result":
        [
            {
                "id": "byu.edu"
              , "key": "byu.edu"
              , "value": {
                    "_id": "byu.edu"
                  , "_rev": "4-a6c6fdf6ea08c71977b1be6cdf8df543"
                  , "school": "byu.edu"
                  , "schoolname": "Brigham Young University"
                  , "timestamp": "Wed Dec 19 2012 18:20:47 GMT+0000 (UTC)"
                }
            }
        ]
    }

## GET /books/:bySort/:isbn

    * finds all books in entire database by `req.params.isbn` in the category `:bySort`
    * bySort - one of 'byTrade', 'byNeed', 'byUnsorted', 'byIgnore', 'byKeep'
    * isbn - the 10 or 13 digit isbn

example:

GET /books/byTrade/9780136054054

    { "success": true, "result":
        "books": [
            {
                "isbn": "9780136054054"
              , "age": 2
              , "title": "Art History Portable Edition, Book 2: Medieval Art (3rd Edition)"
              , "author": "Marilyn Stokstad"
              , "binding": "Paperback"
              , "msrp": "60.00"
              , "publisher": "Prentice Hall"
              , "published_date": "2008-01-07"
              , "edition": "3"
              , "image": "http://isbn.abebooks.com/mz/56/13/0136054056.jpg"
              , "isbn10": "0136054056"
              , "isbn13": "9780136054054"
              , "haveIt": true
              , "wantIt": false
              , "downloadInProgress": true
              , "usedPrice": null
              , "lowest_buy_price": 3.95
              , "highest_buyback_price": 0
              , "fairest_price": 3.95
              , "userToken": "0a8b345ddcfc5401f578c850442f1e1b"
            }
        ]
    }

## GET /booklist/:userToken

example:

    { "success": true, "result":
        {
            "_id": "0a8b345ddcfc5401f578c850442f1e1b:booklist"
          , "_rev": "61-6848a2a38404ec80b87bfb4ba1426823"
          , "userToken": "0a8b345ddcfc5401f578c850442f1e1b"
          , "type": "booklist"
          , "timestamp": 1356581529564
          , "booklist": {
                "9780136054054": {
                    "isbn": "9780136054054"
                  , "age": 2
                  , "title": "Art History Portable Edition, Book 2: Medieval Art (3rd Edition)"
                  , "author": "Marilyn Stokstad"
                  , "binding": "Paperback"
                  , "msrp": "60.00"
                  , "publisher": "Prentice Hall"
                  , "published_date": "2008-01-07"
                  , "edition": "3"
                  , "image": "http://isbn.abebooks.com/mz/56/13/0136054056.jpg"
                  , "isbn10": "0136054056"
                  , "isbn13": "9780136054054"
                  , "haveIt": true
                  , "wantIt": false
                  , "downloadInProgress": true
                  , "usedPrice": null
                  , "lowest_buy_price": 3.95
                  , "highest_buyback_price": 0
                  , "fairest_price": 3.95
                }
            }
        }
    }

## POST /booklist/:userToken

    * userToken can be email or MD5(email)

example:

    {
        "booklist": {
            "9780131743205": {
                "isbn": "9780131743205"
              , "age": 2
              , "title": "Art History, Volume 1 (3rd Edition)"
              , "author": "Marilyn Stokstad"
              , "binding": "Paperback"
              , "msrp": "116.67"
              , "publisher": "Prentice Hall"
              , "published_date": "2007-02-17"
              , "edition": "3"
              , "image": "http://ecx.images-amazon.com/images/I/61XTEGHDXML._SL150_.jpg"
              , "isbn10": "0131743201"
              , "isbn13": "9780131743205"
              , "haveIt": true
              , "wantIt": false
              , "downloadInProgress": true
              , "usedPrice": null
              , "lowest_buy_price": 10.25
              , "highest_buyback_price": 3.2
              , "fairest_price": 6.725
            }
        }
      , "userToken": booklist.userToken
      , "nickname": booklist.nickname
      , "type": booklist.type
      , "school": booklist.school
      , "timestamp": booklist.timestamp
    }

## POST /match

example:

    {
        "to": "md5token"
      , "from": "md5token"
      , "body": "message"
      , "bookTitle": "something or other"
      , "fairPrice": "$20"
    }
