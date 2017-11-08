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
    if (this.g.dialect === this.g.dialects.AZURE) {
      gremlinStr += `.property('${this.g.partition}', '${props[Object.keys(props)[0]]}')`;
    }

    gremlinStr += this.actionBuilder('property', props);
    this.executeQuery(gremlinStr, this, callback);
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
    let gremlinStr = 'g.V()' + this.actionBuilder('has', props);
    this.executeOrPass(gremlinStr, this, callback);
  }

  findE(label, props, depth, callback) {
    let gremlinStr = this.getGremlinStr();
    gremlinStr += `.out('${label}')`;
    this.executeOrPass(gremlinStr, this, callback);
  }
}




module.exports = VertexModel;
