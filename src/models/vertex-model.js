const Model = require('./model');

/**
* @param {string} label
* @param {object} schema
* @param {object} gorm
*/
class VertexModel extends Model {
  constructor(label, schema, gorm) {
    super(gorm, '')
    this.label = label;
    this.schema = schema;
  }

  /**
  * Creates a new vertex
  * Returns single vertex model object
  * @param {object} props
  */
  create(props, callback) {
    if (!callback) throw new Error('Callback is required');
    const checkSchemaResponse = this.checkSchema(this.schema, props, true);
    if (this.checkSchemaFailed(checkSchemaResponse)) {
      callback(checkSchemaResponse);
      return;
    }
    let gremlinStr = `g.addV('${this.label}')`;
    if (this.g.dialect === this.g.DIALECTS.AZURE) {
      gremlinStr += `.property('${this.g.partition}', '${props[Object.keys(props)[0]]}')`;
    }
    gremlinStr += this.actionBuilder('property', props);
    return this.executeQuery(gremlinStr, callback, true);
  }

  /**
  * Creates a new edge
  * @param {string} edge
  * @param {object} props
  * @param {object} vertex
  */
  createEdge(edgeModel, properties, vertex, bothWays, callback) {
    let both, cb;
    if (typeof arguments[3] === 'function' || arguments.length < 4) {
      both = false;
      cb = arguments[3]
    }
    else {
      both = arguments[3];
      cb = arguments[4];
    }
    if (!cb) throw new Error('Callback is required');
    let label, props, model;
    if (typeof edgeModel === 'string') {
      label = edgeModel;
      props = properties;
      model = new this.g.edgeModel(label, {}, this.g)
    }
    else {
      label = edgeModel.label;
      props = this.parseProps(properties, edgeModel);
      model = edgeModel;
    }

    let outGremlinStr = this.getGremlinStr();
    let inGremlinStr = vertex.getGremlinStr();

    if (outGremlinStr === '') {
      return cb({'error': 'Gremlin Query has not been initialised for out Vertex'});
    }
    else if (inGremlinStr === '') {
      return cb({'error': 'Gremlin Query has not been initialised for in Vertex'});
    }
    if (typeof edgeModel !== 'string') {
      const checkSchemaResponse = this.checkSchema(edgeModel.schema, props, true);
      if (this.checkSchemaFailed(checkSchemaResponse)) {
        cb(checkSchemaResponse);
        return;
      }
    }

    // Remove 'g' from 'g.V()...'
    inGremlinStr = inGremlinStr.slice(1);

    const [ a ] = this.getRandomVariable();
    let gremlinQuery = outGremlinStr + `.as('${a}')` + inGremlinStr;
    gremlinQuery += `.addE('${label}')${this.actionBuilder('property', props)}.from('${a}')`;

    if (both === true) {
      const [ b ] = this.getRandomVariable(1, [a]);
      let extraGremlinQuery = `${vertex.getGremlinStr()}.as('${b}')${this.getGremlinStr().slice(1)}` +
                      `.addE('${label}')${this.actionBuilder('property', props)}.from('${b}')`;
      const intermediate = (err, results) => {
        if (err) return cb(err);
        let resultsSoFar = results.slice(0);
        const concater = (err, results) => {
          resultsSoFar = resultsSoFar.concat(results);
          cb(err, resultsSoFar);
        }
        this.executeOrPass.call(model, extraGremlinQuery, concater);
      }
      return this.executeOrPass.call(model, gremlinQuery, intermediate);
    }
    else {
      return this.executeOrPass.call(model, gremlinQuery, cb);
    }
  }

  /**
  * Finds first vertex with matching properties
  * @param {object} properties
  */
  find(properties, callback) {
    const props = this.parseProps(properties);
    let gremlinStr = `g.V(${this.getIdFromProps(props)}).hasLabel('${this.label}')` + this.actionBuilder('has', props);
    gremlinStr += ".limit(1)";
    return this.executeOrPass(gremlinStr, callback, true);
  }

  /**
  * Finds all vertexes with matching properties
  * @param {object} properties
  */
  findAll(properties, callback) {
    const props = this.parseProps(properties);
    let gremlinStr = `g.V(${this.getIdFromProps(props)}).hasLabel('${this.label}')` + this.actionBuilder('has', props);
    return this.executeOrPass(gremlinStr, callback);
  }

  /**
  * find all vertexes connected to initial vertex(es) through a type of edge with optional properties
  * @param {string} label
  * @param {object} properties
  * @param {number} depth
  */

  findRelated(edgeModel, properties, depth, inV, callback) {
    let label, props, inModel, inLabel, cb;
    if (typeof edgeModel === 'string') {
      label = edgeModel;
      props = properties;
    }
    else {
      label = edgeModel.label;
      props = this.parseProps(properties, edgeModel);
    }

    if (arguments.length < 4 || typeof arguments[3] === 'function') {
      inModel = this;
      inLabel = this.label;
      cb = arguments[3];
    }
    else {
      if (typeof arguments[3] === 'string') {
        inLabel = arguments[3];
        inModel = new this.g.vertexModel(inLabel, {}, this.g);
        cb = arguments[4];
      }
      else {
        inModel = arguments[3];
        inLabel = inModel.label;
        cb = arguments[4];
      }
    }

    let gremlinStr = this.getGremlinStr();
    for (let i = 0; i < depth; i += 1) {
      gremlinStr += `.outE().hasLabel('${label}')${this.actionBuilder('has', props)}.inV().hasLabel('${inLabel}')`;
    }
    return this.executeOrPass.call(inModel, gremlinStr, cb);
  }

  /**
  * find all edges connected to initial vertex(es) with matching label and optional properties
  * @param {string} label
  * @param {object} props
  * @param {number} depth
  */
  findEdge(edgeModel, properties, callback) {
    let label, props, model;
    if (typeof edgeModel === 'string') {
      label = edgeModel;
      props = properties;
      model = new this.g.edgeModel(label, {}, this.g)
    }
    else {
      label = edgeModel.label;
      props = this.parseProps(properties, edgeModel);
      model = edgeModel;
    }
    let gremlinStr = this.getGremlinStr();
    gremlinStr += `.bothE('${label}')${this.actionBuilder('has', props)}`;
    return this.executeOrPass.call(model, gremlinStr, callback);
  }

  /**
  * find all vertexes which have the same edge relations in that the current vertex(es) has out to another vertex
  * @param {string} label
  * @param {object} properties
  */
  findImplicit(edgeModel, properties, callback) {
    let label, props, model;
    if (typeof edgeModel === 'string') {
      label = edgeModel;
      props = properties;
    }
    else {
      label = edgeModel.label;
      props = this.parseProps(properties, edgeModel);
    }
    let gremlinStr = this.getGremlinStr();
    let originalAs = this.getRandomVariable()[0];
    gremlinStr += `.as('${originalAs}').outE('${label}')${this.actionBuilder('has', props)}` +
                  `inV().inE('${label}')${this.actionBuilder('has', props)}.outV()` +
                  `.where(neq('${originalAs}'))`;
    return this.executeOrPass(gremlinStr, callback);
  }
}



module.exports = VertexModel;
