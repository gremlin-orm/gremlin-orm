const Gremlin = require('gremlin');
const VertexModel = require('./vertex-model')

class Gorm {
  constructor(dialect, port, url, options) {
    const argLength = arguments.length;
    if (argLength == 0) {
      return null;
    } else if (argLength == 1) {
      this.client = Gremlin.createClient();
    } else if (argLength == 3) {
      this.client = Gremlin.createClient(port, url);
    } else {
      this.client = Gremlin.createClient(port, url, options);
    }
    this.dialect = dialect;
  }

  define(model, schema) {
    return new VertexModel(model, schema, this.client);
  }

}

module.exports = Gorm;
