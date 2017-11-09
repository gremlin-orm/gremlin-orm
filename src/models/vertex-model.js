import Model from './model';

/**
* @param {}
* @param {}
* @param {}
*/
class VertexModel extends Model {
  constructor(label, schema, gorm) {
    super(gorm, '')
    this.label = label;
    this.schema = schema;
  }

  /**
  * Creates a new vertex
  * @param {}
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
    return this.executeQuery(gremlinStr, this, callback);
  }

  /**
  * Creates a new edge
  * @param {}
  * @param {}
  * @param {}
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
  * @param {}
  */
  find(props, callback) {
    let gremlinStr = `g.V(${this.getIdFromProps(props)})` + this.actionBuilder('has', props) + ".limit(1)";
console.log("gremlinStr find Vertex", gremlinStr);
    return this.executeOrPass(gremlinStr, callback, true);
  }

  /**
  * Finds all vertexes with matching properties
  * @param {}
  */
  findAll(props, callback) {
console.log("props", props);
    let gremlinStr = `g.V(${this.getIdFromProps(props)})` + this.actionBuilder('has', props);
console.log("gremlinStr - findAll Vertex", gremlinStr);
    return this.executeOrPass(gremlinStr, callback);
  }

  /**
  * find all vertexes connected to initial vertex(es) through a type of edge with optional properties
  * @param {}
  * @param {}
  * @param {}
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
  * @param {}
  * @param {}
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

export default VertexModel;
