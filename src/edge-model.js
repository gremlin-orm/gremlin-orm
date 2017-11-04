class EdgeModel {
  constructor(label, schema, gorm) {
    this.label = label;
    this.schema = schema;
    this.g = gorm;
  }

  // create(out, in, props, callback) {
  //   // convert props to query string
  //   if (!g.checkSchema()) {
  //
  //     callback({'error': 'Object properties do not match schema.'});
  //     return;
  //   }
  //
  //   let gremlinStr = `g.addV('${this.label}')`;
  //   if (this.g.dialect = 'azure') {
  //     gremlinStr += `.property('${this.g.partition}', '${props[Object.keys(props)[0]]}')`;
  //   }
  //   const propsKeys = Object.keys(props);
  //   propsKeys.forEach(key => {gremlinStr += `.property('${key}', ${stringifyValue(props[key])})`})
  //
  //   this.g.client.execute(gremlinStr, (err, result) => {
  //     if (err) {
  //       callback({'error': err});
  //       return;
  //     }
  //     // Create nicer Object
  //     let response = makeNormalJSON(result, this);
  //
  //     callback(null, response);
  //   });
  // }
}

module.exports = EdgeModel;
