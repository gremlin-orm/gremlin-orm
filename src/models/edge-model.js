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
  * @param {string} outV string representing id
  * @param {object} outV object with properties to find 'out' vertex
  * @param {string} inV string representing id
  * @param {object} inV object with properties to find 'in' vertex
  * @param {object} props object containing key value pairs of properties to add on the new edge
  */
  create(outV, inV, props, callback) {
    if (!(outV && inV)) {
      callback({'error': 'Need both an inV and an outV.'});
      return;
    }
    const checkSchemaResponse = this.checkSchema(this.schema, props, true);
    if (!this.interpretCheckSchema(checkSchemaResponse)) {
      callback(checkSchemaResponse);
      return;
    }
    let outVKey = 'id';
    let outVValue = outV;
    let inVKey = 'id';
    let inVValue = inV;
    if (outV.constructor === Object) {
      outVKey = outV.key;
      outVValue = outV.value;
    }

    if (inV.constructor === Object) {
      inVKey = inV.key;
      inVValue = inV.value;
    }

    let gremlinStr = `g.V().has('${outVKey}',${this.stringifyValue(outVValue)})`;
    gremlinStr += `.addE('${this.label}')` + this.actionBuilder('property', props);
    gremlinStr += `.to(g.V().has('${inVKey}',${this.stringifyValue(inVValue)}))`;

    return this.executeQuery(gremlinStr, callback, true);
  }

  // NOT FULLY TESTED
  find(props, callback) {
    let gremlinStr = `g.E(${this.getIdFromProps(props)}).hasLabel('${this.label}')` + this.actionBuilder('has', props);
    gremlinStr += ".limit(1)";
    return this.executeOrPass(gremlinStr, callback, true);
  }

  // NOT FULLY TESTED
  findAll(props, callback) {
    let gremlinStr = `g.E(${this.getIdFromProps(props)}).hasLabel('${this.label}')` + this.actionBuilder('has', props);
    return this.executeOrPass(gremlinStr, callback);
  }

  // NOT YET TESTED
  findVertex(props, callback) {
    let gremlinStr = this.getGremlinStr();
    gremlinStr += `.bothV()${this.actionBuilder('has', props)}`;
    return this.executeOrPass(gremlinStr, callback);
  }

}

module.exports = EdgeModel;
