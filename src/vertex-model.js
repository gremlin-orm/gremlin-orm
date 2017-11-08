class VertexModel {
  constructor(label, schema, gorm) {
    this.label = label;
    this.schema = schema;
    this.g = gorm;
  }

  create(props, callback) {
    if (!this.g.checkSchema(this.schema, props, true)) {
      callback({'error': 'Object properties do not match schema.'});
      return;
    }

    let gremlinStr = `g.addV('${this.label}')`;
    if (this.g.dialect === this.g.AZURE) {
      gremlinStr += `.property('${this.g.partition}', '${props[Object.keys(props)[0]]}')`;
    }

    gremlinStr += this.g.actionBuilder('property', props);
    executeQuery(gremlinStr, this, callback);
  }

  find(props, callback) {
    let gremlinStr = 'g.V()' + this.g.actionBuilder('has', props);
    if (callback) executeQuery(gremlinStr, this, callback);
    else {
      let response = Object.create(this);
      response.gremlinStr = gremlinStr;
      return response;
    }
  }

  findE(label, props, depth, callback) {
    let gremlinStr = isInstance(this);
    gremlinStr += `.out('${label}')`;
    if (callback) executeQuery(gremlinStr, this, callback);
    else {
      let response = Object.create(this);
      response.gremlinStr = gremlinStr;
      return response;
    }
  }

  delete(id, callback) {
    let gremlinStr = `g.V().has('id', '${id}').drop()`;
    this.g.client.execute(gremlinStr, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      let response = `${id} deleted successfully`;
      callback(null, response);
    });
  }
}

const executeQuery = (query, parentClass, callback) => {
  parentClass.g.client.execute(query, (err, result) => {
    if (err) {
      callback({'error': err});
      return;
    }
    // Create nicer Object
    let response = familiarizeAndPrototype(result, parentClass);

    callback(null, response);
  });
}

const familiarizeAndPrototype = (gremlinResponse, parentClass) => {
  parentClass = parentClass || this;
  let data = [];
  gremlinResponse.forEach((grem) => {
    let object = Object.create(parentClass);
    object.id = grem.id;
    object.label = grem.label;
    let currentPartition = parentClass.partition ? parentClass.partition : '';

    Object.keys(grem.properties).forEach((propKey) => {
      if (propKey != currentPartition) {
        object[propKey] = grem.properties[propKey][0].value;
      }
    });
    data.push(object);
  })
  return data;
}

module.exports = VertexModel;
