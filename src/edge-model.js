class EdgeModel {
  constructor(label, schema, gorm) {
    this.type = type;
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

    // g.V().has('name','sarah').addE('knows').to(g.V().has('name','susan'))
    let gremlinStr = `g.V().has('${outVKey}', ${this.g.stringifyValue(outVValue)})`;
    gremlinStr += `.addE('${this.label}').to(g.V().has('${inVKey}', ${this.g.stringifyValue(inVValue)}))`
    //THIS NEEDS TO NOW DEAL WITH PROPS ON THE EDGE
    // const propsKeys = Object.keys(props);
    // propsKeys.forEach(key => {gremlinStr += `.property('${key}', ${stringifyValue(props[key])})`})
    this.g.client.execute(gremlinStr, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      // Create nicer Object
      // let response = this.g.makeNormalJSON(result, this);

      callback(null, result);
    });
  }
}

module.exports = EdgeModel;
