class VertexModel {
  constructor(type, schema, client) {
    this.type = type;
    this.schema = schema;
    this.client = client;

    checkSchema = checkSchema.bind(this);
    stringifyValue = stringifyValue.bind(this);
  }

  create(props, callback) {
    // convert props to query string
    if (!checkSchema(schema, props, true)) {
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

module.exports = VertexModel;
