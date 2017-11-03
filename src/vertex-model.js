class VertexModel {
  constructor(type, schema, client) {
    this.type = type;
    this.schema = schema;
    this.client = client;
  }

  create(props, callback) {
    // convert props to query string

    let response = this.client(query)

    // convert response to javascript obje
    let obj;

    callback(err, obj);
  }

  find(props, callback) {
    // convert props to query string

    let response = this.client(query)

    // convert response to javascript obje
    let obj;

    callback(err, obj);
  }

}

module.exports = VertexModel;
