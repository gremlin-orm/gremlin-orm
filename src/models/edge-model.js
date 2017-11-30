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
  create(outV, inV, props, bothWays, callback) {
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
    if (!(outV && inV)) {
      cb({'error': 'Need both an inV and an outV.'});
      return;
    }
    const checkSchemaResponse = this.checkSchema(this.schema, props, true);
    if (this.checkSchemaFailed(checkSchemaResponse)) {
      cb(checkSchemaResponse);
      return;
    }

    let outGremlinStr = outV.getGremlinStr();
    let inGremlinStr = inV.getGremlinStr().slice(1);

    const [ a ] = this.getRandomVariable();
    let gremlinQuery = outGremlinStr + `.as('${a}')` + inGremlinStr;
    gremlinQuery += `.addE('${this.label}')${this.actionBuilder('property', props)}.from('${a}')`;

    if (both === true) {
      const [ b ] = this.getRandomVariable(1, [a]);
      let extraGremlinQuery = `${inV.getGremlinStr()}.as('${b}')${outV.getGremlinStr().slice(1)}` +
                      `.addE('${this.label}')${this.actionBuilder('property', props)}.from('${b}')`;
      let intermediate = (err, results) => {
        let resultsSoFar = results.slice(0);
        const concater = (err, results) => {
          resultsSoFar = resultsSoFar.concat(results);
          cb(err, resultsSoFar);
        }
        this.executeQuery(extraGremlinQuery, concater);
      }
      return this.executeQuery(gremlinQuery, intermediate);
    }
    else {
      return this.executeQuery(gremlinQuery, cb);
    }
  }

  /**
  * finds the first edge with properties matching props object
  * @param {object} props Object containing key value pairs of properties
  * @param {function} callback Some callback function with (err, result) arguments
  */
  find(props, callback) {
    let gremlinStr = `g.E(${this.getIdFromProps(props)}).hasLabel('${this.label}')` + this.actionBuilder('has', props);
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
      model = new this.g.vertexModel(label, {}, this.g)
    }
    else {
      props = this.parseProps(properties, vertexModel);
      model = vertexModel;
      label = model.label;
    }
    let gremlinStr = this.getGremlinStr();
    gremlinStr += `.bothV()${this.actionBuilder('has', props)}`;
    return this.executeOrPass.call(model, gremlinStr, callback);
  }
}

module.exports = EdgeModel;
