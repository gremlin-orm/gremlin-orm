class VertexModel {
  constructor(label, schema, client, dialect, partition) {
    this.label = label;
    this.schema = schema;
    this.client = client;
    this.dialect = dialect;
    this.partition = partition;
  }

  create(props, callback) {
    // convert props to query string
    if (!checkSchema()) {
      callback({'error': 'Object properties do not match schema.'});
      return;
    }

    let gremlinStr = `g.addV('${this.label}')`;
    if (this.dialect = 'azure') {
      gremlinStr += `.property('${this.partition}', '${props[Object.keys(props)[0]]}')`;
    }
    const propsKeys = Object.keys(props);
    propsKeys.forEach(key => {gremlinStr += `.property('${key}', ${stringifyValue(props[key])})`})

    this.client.execute(gremlinStr, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      // Create nicer Object
      let response = makeNormalJSON(result, this);

      callback(null, response);
    });
  }

  find(props, callback) {
    // convert props to query string

    // let response = this.client(query)

    // convert response to javascript obje
    // let obj;

    // callback(err, obj);
  }
}

function checkSchema(props) {
  return true;
}

function stringifyValue(value) {
  if (typeof value === 'string') {
    return `'${value}'`;
  } else {
    return `${value}`;
  }
}

function makeNormalJSON(gremlinResponse, parentClass) {
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
