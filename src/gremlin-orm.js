const Gremlin = require('gremlin');
const VertexModel = require('./vertex-model')

class Gorm {
  constructor(port, url, options, dialect) {
    this.client = Gremlin.createClient(port, url, options);
    this.dialect = dialect;
  }

  define(model, schema) {
    return new VertexModel(model, schema, this.client);
  }

}

module.exports = Gorm;
