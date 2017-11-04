class EdgeModel {
  constructor(label, schema, gorm) {
    this.label = label;
    this.schema = schema;
    this.g = gorm;
  }

  create(outV, inV, props, callback) {
    if (!(outV && inV)) {
      callback({'error': 'Need both an inV and an outV.'});
      return;
    }
    if (!this.g.checkSchema(this.schema, props, true)) {
      callback({'error': 'Object properties do not match schema.'});
      return;
    }

    // console.log('this', this);
    // // console.log('instanceof this', instanceof this );

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

    let gremlinStr = `g.V().has('${outVKey}',${this.g.stringifyValue(outVValue)})`;
    gremlinStr += `.addE('${this.label}')` + this.g.actionBuilder('property', props);
    gremlinStr += `.to(g.V().has('${inVKey}',${this.g.stringifyValue(inVValue)}))`;
    this.g.client.execute(gremlinStr, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      callback(null, result);
    });
  }
}

module.exports = EdgeModel;