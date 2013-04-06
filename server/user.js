(function () {
  "use strict";

  // RFC Allowed: ! # $ % & ' * + - / = ? ^ _ ` { | } ~
  // Hotmail Disallowed ! # $ % * / ? ^ ` { | } ~
  // (I agree with MS on this one!)
  var crypto = require('crypto')
    , emailRegExp = /^[\-&'+=_\w\.]+@[\-\w\.]+\.\w{1,8}$/i
    , schoolRegExp = /^(?:https?:\/\/)?(?:[\-\w\.]+\.)?([\-\w]+\.(?:edu|gov))$/i
    ;
  // "http://www.byu.edu"
  // "http://www-apps.byu.edu"
  // "http://www-apps.byu-i.edu"
  // "byu.edu"

  function BlyphUser(obj) {
    var md5sum = crypto.createHash('md5')
      ;

    this.errors = [];

    this.type = 'user';

    if (!obj) {
      this.errors.push("empty user");
      return;
    }

    if ('string' !== typeof obj.email || !emailRegExp.exec(obj.email.trim())) {
      this.errors.push("bad email address");
      return;
    }
    // TODO remove extraneous '.' and trailing '+xyz' for 
    //if (email.match(/@gmail\./) || email.match(/@googlemail\./)) {
    //}
    this.email = obj.email.trim().toLowerCase();
    md5sum.update(this.email);
    this.userToken = md5sum.digest('hex').trim().toLowerCase();

    if ('string' !== typeof obj.school || !schoolRegExp.exec(obj.school.trim())) {
      this.errors.push("bad school address");
      return;
    }
    this.school = obj.school.trim().toLowerCase();

  }
  BlyphUser.create = function (obj) {
    return new BlyphUser(obj);
  };
  // t: coolaj86@gmail.com
  // t: coolaj.86+wow_z-ers@google.mail.com
  // f: coolaj86@gmail
  // f: coolaj86@gmail.
  // f: @gmail.com

  exports.BlyphUser = BlyphUser;
}());
