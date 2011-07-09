// NOTE: OpenDNS will return itself rather than an error. UGH!
// edit /etc/resolv.conf and use Google's 8.8.8.8 and 8.8.4.4
// addresses such as 67.215.65.132
(function () {
  "use strict";

  var dns = require('dns');

  dns.lookup('www.reallydoesntexistaltal.edu', function (err, address) {
    console.log(arguments);
  });

  // TODO strip the address down to xyz.edu
  // test that the reverse lookup matches the base
  dns.lookup('byu.edu', function (err, address) {
    console.log(arguments);
    if (err) {
      return;
    }
    dns.reverse(address, function (err, domains) {
      console.log(arguments);
    });
  });

}());
