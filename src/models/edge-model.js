import Model from './model';

/**
* @param {}
* @param {}
* @param {}
*/
class EdgeModel extends Model {
  constructor(label, schema, gorm) {
    super(gorm, '');
    this.label = label;
    this.schema = schema;
  }

  /**
  * create a new edge relationship by passing in two vertexes or sets of vertexes
  * @param {}
  * @param {}
  * @param {}
  */
  create(outV, inV, props, callback) {
    if (!(outV && inV)) {
      callback({'error': 'Need both an inV and an outV.'});
      return;
    }
    if (!this.checkSchema(this.schema, props, true)) {
      callback({'error': 'Object properties do not match schema.'});
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

    return this.executeQuery(gremlinStr, this, callback);
  }

  // NOT FULLY TESTED
  find(props, callback) {
    let gremlinStr = `g.E(${this.getIdFromProps(props)})` + this.actionBuilder('has', props) + ".limit(1)";
console.log("gremlinStr - find Edges", gremlinStr);
    return this.executeOrPass(gremlinStr, this, callback, true);
  }

  // NOT FULLY TESTED
  findAll(props, callback) {
    let gremlinStr = `g.E(${this.getIdFromProps(props)})` + this.actionBuilder('has', props);
console.log("gremlinStr - findAll Edges", gremlinStr);
    return this.executeOrPass(gremlinStr, this, callback);
  }


}

export default EdgeModel;
