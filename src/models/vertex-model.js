const Model = require('./model');

class VertexModel extends Model {
  constructor(label, schema, gorm) {
    super(gorm, '')
    this.label = label;
    this.schema = schema;
  }

  create(props, callback) {
    if (!this.checkSchema(this.schema, props, true)) {
      callback({'error': 'Object properties do not match schema.'});
      return;
    }

    let gremlinStr = `g.addV('${this.label}')`;
    if (this.g.dialect === this.g.AZURE) {
      gremlinStr += `.property('${this.g.partition}', '${props[Object.keys(props)[0]]}')`;
    }

    gremlinStr += this.actionBuilder('property', props);
    this.executeQuery(gremlinStr, this, callback);
  }

  find(props, callback) {
    let gremlinStr = 'g.V()' + this.actionBuilder('has', props);
    if (callback) this.executeQuery(gremlinStr, this, callback);
    else {
      let response = Object.create(this);
      response.gremlinStr = gremlinStr;
      return response;
    }
  }

  findE(label, props, depth, callback) {
    let gremlinStr = isInstance(this);
    gremlinStr += `.out('${label}')`;
    if (callback) this.executeQuery(gremlinStr, this, callback);
    else {
      let response = Object.create(this);
      response.gremlinStr = gremlinStr;
      return response;
    }
  }
}




module.exports = VertexModel;
