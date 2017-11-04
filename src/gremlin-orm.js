const Gremlin = require('gremlin');
const VertexModel = require('./vertex-model');

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

    if (Array.isArray(dialect)) {
      this.dialect = dialect[0];
      this.partition = dialect[1];
    }
    else {
      this.dialect = dialect;
    }

  }

  define(label, schema) {
    return new VertexModel(label, schema, this.client, this.dialect, this.partition);
  }

}

module.exports = Gorm;
