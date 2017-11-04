class VertexModel {
  constructor(type, schema, client) {
    this.type = type;
    this.schema = schema;
    this.client = client;
  }

  create(props, callback) {
    // convert props to query string
    if (!checkSchema()) {
      callback("ERORR");
      return;
    }

    let gremlinStr = `g.addV('${this.type}')`;
    const propsArr = Object.entries(props); 
    propsArr.forEach(keyValuePair => gremlinStr += `.property('${keyValuePair[0]}', ${stringifyValue(keyValuePair[1])})`)
  
    this.client.execute(gremlinStr, callback);

    
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


module.exports = VertexModel;
