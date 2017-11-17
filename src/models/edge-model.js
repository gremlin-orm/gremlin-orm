const Model = require('./model');

/**
* @param {string} label
* @param {object} schema
* @param {object} gorm
*/
class EdgeModel extends Model {
  constructor(label, schema, gorm) {
    super(gorm, '');
    this.label = label;
    this.schema = schema;
  }

  /**
  * creates an index from out vertex(es) to the in vertex(es)
  * @param {object} outV object with properties to find 'out' vertex
  * @param {object} inV object with properties to find 'in' vertex
  * @param {object} props object containing key value pairs of properties to add on the new edge
  */
  create(outV, inV, props, callback) {
    if (!(outV && inV)) {
      callback({'error': 'Need both an inV and an outV.'});
      return;
    }
    const checkSchemaResponse = this.checkSchema(this.schema, props, true);
    if (this.interpretCheckSchema(checkSchemaResponse)) {
      callback(checkSchemaResponse);
      return;
    }
    let gremlinStr = outV.getGremlinStr();
    gremlinStr += `.addE('${this.label}')` + this.actionBuilder('property', props);
    gremlinStr += `.to(${inV.getGremlinStr()})`;
    return this.executeQuery(gremlinStr, callback, true);
  }

  /**
  * finds the first edge with properties matching props object
  * @param {object} props Object containing key value pairs of properties
  * @param {function} callback Some callback function with (err, result) arguments
  */
  find(props, callback) {
    let gremlinStr = `g.E(${this.getIdFromProps(props)}).hasLabel('${this.label}')` + this.actionBuilder('has', props);
    gremlinStr += ".limit(1)";
    return this.executeOrPass(gremlinStr, callback, true);
  }

  /**
  * finds the all edges with properties matching props object
  * @param {object} props Object containing key value pairs of properties
  * @param {function} callback Some callback function with (err, result) arguments
  */
  findAll(props, callback) {
    let gremlinStr = `g.E(${this.getIdFromProps(props)}).hasLabel('${this.label}')` + this.actionBuilder('has', props);
    return this.executeOrPass(gremlinStr, callback);
  }

  /**
  * finds the all vertices with properties matching props object connected by the relevant edge(s)
  * @param {object} vertexModel vertexModel that corresponds to the vertex
  * @param {object} properties Object containing key value pairs of properties to find on vertices
  * @param {function} callback Some callback function with (err, result) arguments
  */
  findVertex(vertexModel, properties, callback) {
    let label, props, model;
    if (typeof vertexModel === 'string') {
      label = vertexModel;
      props = properties;
      model = new this.g.vertexModel('fake', {}, this.g)
    }
    else {
      props = this.parseProps(properties, vertexModel);
      model = vertexModel;
      label = model.label;
    }
    let gremlinStr = this.getGremlinStr();
    gremlinStr += `.bothV()${this.actionBuilder('has', props)}`;
    let executeBound = this.executeOrPass.bind(model);
    return executeBound(gremlinStr, callback);
  }
}

module.exports = EdgeModel;
