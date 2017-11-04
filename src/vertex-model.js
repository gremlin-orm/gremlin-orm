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
    if (this.g.dialect === this.g.AZURE) {
      gremlinStr += `.property('${this.g.partition}', '${props[Object.keys(props)[0]]}')`;
    }
    gremlinStr += this.g.actionBuilder('property', props);
    this.g.client.execute(gremlinStr, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      // Create nicer Object
      let response = this.g.makeNormalJSON(result, this);

      callback(null, response);
    });
  }

  find(props, callback) { // { name: 'bob' , age: 2}
    let gremlinStr = 'g.V()' + this.g.actionBuilder('has', props);
    this.g.client.execute(gremlinStr, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      // Create nicer Object
      let response = this.g.makeNormalJSON(result, this);

      callback(null, response);
    });
  }

  findE(label, props, depth, callback) {
    // g.V().has('id', '2e3fa69a-d130-4b26-99be-0a9cd98a9efb').out('knows').out('knows')
    let curr = this;
    let gremlinStr = `g.V().has('id', '${curr.id}').out('${label}')`;
    if (depth > 1) {
      for (let i = 0; i < depth - 1; i += 1) {
        gremlinStr += `.out('${label}')`;
      }
    }
    this.g.client.execute(gremlinStr, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      // Create nicer Object
      let response = this.g.makeNormalJSON(result, this);

      callback(null, response);
    });
  }
}

module.exports = VertexModel;
