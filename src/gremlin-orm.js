const Gremlin = require('gremlin');
const VertexModel = require('./models/vertex-model');
const EdgeModel = require('./models/edge-model');
// const QueryBuilders = require('./query-builders');

class Gorm {
  constructor(dialect, port, url, options) {
    this.dialects = {AZURE: 'azure'};
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
    this.definedVertices = {};
    this.definedEdges = {};
  }

  define(label, schema) {
    return this.defineVertex(label, schema);
  }

  defineVertex(label, schema) {
    this.definedVertices[label] = schema;
    return new VertexModel(label, schema, this);
  }

  defineEdge(label, schema) {
    this.definedEdges[label] = schema;
    return new EdgeModel(label, schema, this);
  }

  queryRaw(string, callback) {
    return this.client.execute(string, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      callback(null, result);
    });
  }

  /**
  *
  * @param {array} gremlinResponse
  */
  familiarizeAndPrototype(gremlinResponse) {
    let data = [];
    gremlinResponse.forEach((grem) => {
      let object;
      if (!this.checkModels) object = Object.create(this);
      else {
        if (grem.type === 'vertex') object = Object.create(EdgeModel);
        else if (grem.type === 'edge') object = Object.create(VertexModel);
      }
      object.id = grem.id;
      object.label = grem.label;
      if (grem.type === 'edge') {
        object.inV = grem.inV;
        object.outV = grem.outV
        if (grem.inVLabel) object.inVLabel = grem.inVLabel;
        if (grem.outVLabel) object.outVLabel = grem.outVLabel;
      }

      let currentPartition = this.g.partition ? this.g.partition : '';
      if (grem.properties) {
        Object.keys(grem.properties).forEach((propKey) => {
          if (propKey != currentPartition) {
            if (this.constructor.name === 'EdgeModel') {
              object[propKey] = grem.properties[propKey];
            } else {
              object[propKey] = grem.properties[propKey][0].value;
            }
          }
        });
      }
      data.push(object);
    })
    this.addArrayMethods(data);
    this.checkModels = false;
    return data;
  }
}

module.exports = Gorm;
