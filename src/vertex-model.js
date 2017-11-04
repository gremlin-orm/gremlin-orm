class VertexModel {
  constructor(label, schema, gorm) {
    this.label = label;
    this.schema = schema;
    this.g = gorm;
  }

  create(props, callback) {
    // convert props to query string

    if (!this.g.checkSchema(this.schema, props, true)) {
      callback({'error': 'Object properties do not match schema.'});
      return;
    }

    let gremlinStr = `g.addV('${this.label}')`;
    if (this.g.dialect = 'azure') {
      gremlinStr += `.property('${this.g.partition}', '${props[Object.keys(props)[0]]}')`;
    }
    const propsKeys = Object.keys(props);
    propsKeys.forEach(key => {gremlinStr += `.property('${key}', ${this.g.stringifyValue(props[key])})`})
    this.g.client.execute(gremlinStr, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      // Create nicer Object
      let response = this.g.makeNormalJSON(result);

      callback(null, response);
    });
  }

  find(props, callback) {
    let gremlinStr = `g.V()`;
    Object.keys(props).forEach((key) => {
      gremlinStr += `.has('${key}', ${this.g.stringifyValue(props[key])})`
    });
    this.g.client.execute(gremlinStr, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      // Create nicer Object
      let response = this.g.makeNormalJSON(result);

      callback(null, response);
    });
  }
}

module.exports = VertexModel;
