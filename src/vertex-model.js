
class VertexModel  {
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

  createE(edge, props, vertex, callback) {
    let outGremlinStr = this.getGremlinStr();
    if (outGremlinStr === '') {
      callback({'error': 'Gremlin Query has not been initialised for out Vertex'});
    }
    let inGremlinStr = vertex.getGremlinStr();
    if (inGremlinStr === '') {
      callback({'error': 'Gremlin Query has not been initialised for in Vertex'});
    }
    // const schemaCheck = this.checkSchema(edge.schema, props, true);
    // if (Object.keys(schemaCheck).length === 0) {
    //   callback({'error': schemaCheck});
    // }
    let gremlinQuery = outGremlinStr + `.addE('${edge.label}')${this.actionBuilder('property', props)}.to(` + 
                                        inGremlinStr + ")";
                                        
    executeOrPass(gremlinQuery, this, callback);
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
    let curr = this;
    let gremlinStr = 'g.v()';
    if (curr.gremlinStr) gremlinStr = curr.gremlinStr;
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
