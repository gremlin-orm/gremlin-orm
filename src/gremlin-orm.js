const Gremlin = require('gremlin');
const VertexModel = require('./vertex-model')

class Gorm {
  constructor(port, url, options, dialect) {
    this.client = Gremlin.createClient(port, url, options);
    this.dialect = dialect;
  }

  define(type, schema) {
    return new VertexModel(type, schema, this.client);
  }

}

module.exports = Gorm;
