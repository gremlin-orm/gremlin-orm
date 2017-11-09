const Model = require('./model');


class EdgeModel extends Model {
  constructor(label, schema, gorm) {
    super(gorm, '');
    this.label = label;
    this.schema = schema;
  }

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

  // find(props, callback) {
  //   let gremlinStr = 'g.V()' + this.actionBuilder('has', props);
  //   return this.executeOrPass(gremlinStr, this, callback);
  // }

  // findV(label, props, depth, callback) {
  //   let gremlinStr = this.getGremlinStr();
  //   gremlinStr += `.out('${label}')`;
  //   return this.executeOrPass(gremlinStr, this, callback);
  // }


}

module.exports = EdgeModel;
