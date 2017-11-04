class EdgeModel {
  constructor(label, schema, gorm) {
    this.label = label;
    this.schema = schema;
    this.g = gorm;
  }

  create(outV, inV, props, callback) {
    // convert props to query string
    if (!g.checkSchema(this.schema, props, true)) {
      callback({'error': 'Object properties do not match schema.'});
      return;
    }

    console.log('this', this);
    // console.log('instanceof this', instanceof this );

    // let gremlinStr = `g.addV('${this.label}')`;
    // if (this.dialect = 'azure') {
    //   gremlinStr += `.property('${this.partition}', '${props[Object.keys(props)[0]]}')`;
    // }
    // const propsKeys = Object.keys(props);
    // propsKeys.forEach(key => {gremlinStr += `.property('${key}', ${stringifyValue(props[key])})`})

    // this.client.execute(gremlinStr, (err, result) => {
    //   if (err) {
    //     callback({'error': err});
    //     return;
    //   }
    //   // Create nicer Object
    //   let response = makeNormalJSON(result, this);

    //   callback(null, response);
    // });
  }

}

module.exports = EdgeModel;