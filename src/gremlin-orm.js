const Gremlin = require('gremlin');
const VertexModel = require('./models/vertex-model');
const EdgeModel = require('./models/edge-model');

class Gorm {
  constructor(dialect, port, url, options) {
    // Constants
    this.DIALECTS = {AZURE: 'azure'};
    this.STRING = 'string';
    this.NUMBER = 'number';
    this.BOOLEAN = 'boolean';
    this.DATE = 'date';

    const argLength = arguments.length;
    if (argLength === 0) {
      this.client = null;
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
    this.vertexModel = VertexModel;
    this.edgeModel = EdgeModel;
  }

  /**
  * an alias for defineVertex
  * @param {string} label
  * @param {object} schema
  */
  define(label, schema) {
    return this.defineVertex(label, schema);
  }

  /**
  * defines a new instance of the VertexModel class - see generic and vertex model methods
  * @param {string} label label to be used on all vertices of this model
  * @param {object} schema a schema object which defines allowed property keys and allowed values/types for each key
  */
  defineVertex(label, schema) {
    this.definedVertices[label] = schema;
    return new VertexModel(label, schema, this);
  }

  /**
  * defines a new instance of the EdgeModel class - see generic and edge model methods
  * @param {string} label label to be used on all edges of this model
  * @param {object} schema a schema object which defines allowed property keys and allowed values/types for each key
  */
  defineEdge(label, schema) {
    this.definedEdges[label] = schema;
    return new EdgeModel(label, schema, this);
  }

  /**
  * performs a raw query on the gremlin-orm root and return raw data
  * @param {string} string Gremlin query as a string
  * @param {function} callback Some callback function with (err, result) arguments.
  */
  queryRaw(string, callback) {
    this.client.execute(string, (err, result) => {
      callback(err, result);
    });
  }

  /**
  * @param {array} gremlinResponse
  */
  familiarizeAndPrototype(gremlinResponse) {
    let data = [];
    gremlinResponse.forEach((grem) => {
      let object;
      if (!this.checkModels) object = Object.create(this);
      else {
        if (grem.type === 'vertex') object = Object.create(new VertexModel('string', {}, this.g));
        else if (grem.type === 'edge') object = Object.create(new EdgeModel('string', {}, this.g));
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
            let property;
            if (grem.type === 'edge') {
              property = grem.properties[propKey];
            } else {
              property = grem.properties[propKey][0].value;
            }

            if (this.g.definedVertices[grem.label]) {
              if (this.g.definedVertices[grem.label][propKey].type === this.g.DATE) {
                object[propKey] = new Date(property);
              }
              else {
                object[propKey] = property;
              }
            }
            else if (this.g.definedEdges[grem.label]) {
              if (this.g.definedEdges[grem.label][propKey].type === this.g.DATE) {
                object[propKey] = new Date(property);
              }
              else {
                object[propKey] = property;
              }
            }
            else {
              object[propKey] = property;
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
