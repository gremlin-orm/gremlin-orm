const Gremlin = require('gremlin');
const VertexModel = require('./models/vertex-model');
const EdgeModel = require('./models/edge-model');
// const QueryBuilders = require('./query-builders');

class Gorm {
  constructor(dialect, port, url, options) {
    const AZURE = 'azure';
    const argLength = arguments.length;
    if (argLength === 0) {
      return null;
    } else if (argLength === 1) {
      this.client = Gremlin.createClient();
    } else if (argLength === 3) {
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
    // this.hasProps = QueryBuilders.hasProps;
    // this.actionBuilder = QueryBuilders.actionBuilder;
    // this.stringifyValue = QueryBuilders.stringifyValue;
  }

  define(label, schema) {
    return this.defineVertex(label, schema);
  }

  defineVertex(label, schema) {
    return new VertexModel(label, schema, this);
  }

  defineEdge(label, schema) {
    return new EdgeModel(label, schema, this);
  }

  
}

module.exports = Gorm;
