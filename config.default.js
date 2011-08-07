module.exports = {
    db: "coolaj86.couchone.com"
  , port: 80
  , vhost: "blyph.com"
  , sessionSecret: "Baby, ride your Firebolt!"
  , emailjs: {
        user: "aj@blyph.com"
      , password: "Wh1t3Ch3dd3r"
      , host: "smtp.gmail.com"
      , ssl: true
    }
  , cradle: {
        host: 'coolaj86.couchone.com'
      , port: 443
      , options: {
            secure: true
          , auth: {
                username: 'coolaj86'
              , password: 'Wh1t3Ch3dd3r'
            }
          , database: 'syllabi'
        }
    }
};
