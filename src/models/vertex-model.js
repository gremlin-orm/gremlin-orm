const Model = require('./model');

/**
* @param {string} label
* @param {object} schema
* @param {object} gorm
*/
class VertexModel extends Model {
  constructor(label, schema, gorm) {
    super(gorm, '')
    this.label = label;
    this.schema = schema;
  }

  /**
  * Creates a new vertex
  * @param {object} props
  */
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
    return this.executeQuery(gremlinStr, callback);
  }

  /**
  * Creates a new edge
  * @param {} edge
  * @param {} props
  * @param {} vertex
  */
  createE(edge, props, vertex, callback) {
    let outGremlinStr = this.getGremlinStr();
    if (outGremlinStr === '') {
      callback({'error': 'Gremlin Query has not been initialised for out Vertex'});
    }
    let inGremlinStr = vertex.getGremlinStr();
    if (inGremlinStr === '') {
      callback({'error': 'Gremlin Query has not been initialised for in Vertex'});
    }
    inGremlinStr = inGremlinStr.slice(1);
    // const schemaCheck = this.checkSchema(edge.schema, props, true);
    // if (Object.keys(schemaCheck).length === 0) {
    //   callback({'error': schemaCheck});
    // }
    const [ a ] = this.getRandomVariable();
    let gremlinQuery = outGremlinStr + `.as('${a}')` + inGremlinStr;
    gremlinQuery += `.addE('${edge.label}')${this.actionBuilder('property', props)}.from('${a}')`;
    return this.executeOrPass(gremlinQuery, callback).bind(edge);
  }

  /**
  * Finds first vertex with matching properties
  * @param {object} props
  */
  find(props, callback) {
    let gremlinStr = `g.V(${this.getIdFromProps(props)}).hasLabel('${this.label}')` + this.actionBuilder('has', props);
    gremlinStr += ".limit(1)";
    return this.executeOrPass(gremlinStr, callback, true);
  }

  /**
  * Finds all vertexes with matching properties
  * @param {object} props
  */
  findAll(props, callback) {
    let gremlinStr = `g.V(${this.getIdFromProps(props)}).hasLabel('${this.label}')` + this.actionBuilder('has', props);
    return this.executeOrPass(gremlinStr, callback);
  }

  /**
  * find all vertexes connected to initial vertex(es) through a type of edge with optional properties
  * @param {string} label
  * @param {object} props
  * @param {number} depth
  */
  findE(label, props, depth, callback) {
    let gremlinStr = this.getGremlinStr();
    for (let i = 0; i < depth; i += 1) {
      gremlinStr += `.out('${label}')`;
    }
    return this.executeOrPass(gremlinStr, callback);
  }

  /**
  * find all vertexes which have the same edge relations in that the current vertex(es) has out to another vertex
  * @param {string} label
  * @param {object} props
  */
  findImplicit(label, props, callback) {
    let gremlinStr = this.getGremlinStr();
    let originalAs = this.getRandomVariable()[0];
    gremlinStr += `.as('${originalAs}').out('${label}')${this.actionBuilder('property', props)}` +
                  `.in('${label}')${this.actionBuilder('property', props)}` +
                  `.where(neq('${originalAs}'))`;
    return this.executeOrPass(gremlinStr, callback);
  }
}



module.exports = VertexModel;
