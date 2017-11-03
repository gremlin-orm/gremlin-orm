const Gremlin = require('gremlin');

function Gorm(port, url, options) {
  const client = Gremlin.createClient(port, url, options);

}

module.exports = Gorm;
