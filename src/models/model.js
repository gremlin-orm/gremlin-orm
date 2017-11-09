/**
* @param {object} gorm
* @param {string} gremlinStr
*/
class Model {
  constructor(gorm, gremlinStr) {
    this.g = gorm;
    this.gremlinStr = gremlinStr;
  }

  /**
  * Takes the built query string and executes it
  * @param {string} query query string to execute.
  * @param {object} childClass
  * @param {object} singleObject
  */
  executeQuery(query, childClass, callback, singleObject) {
    this.g.client.execute(query, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      // Create nicer Object
      let response = this.familiarizeAndPrototype(result, childClass);
      if(singleObject && response.length > 0) {
        callback(null, response[0]);
        return;
      }
      callback(null, response);
    });
  }

  /**
  * Sorts query results by property in ascending/descending order 
  * @param {string} propKey property to sort by.
  * @param {string} option 'ASC' or 'DESC'.
  */
  order(propKey, option, callback) {
    let gremlinStr = `${this.getGremlinStr}.order().by(`;
    const gremlinOption = option === 'DESC' ? 'decr' : 'incr';
    gremlinStr += `'${propKey}', ${gremlinOption})`;

    return this.executeOrPass(gremlinStr, callback);
  }

  /**
  * Executes or passes a string of command 
  * @param {string} gremlinStr
  * @param {object} singleObject
  */
  executeOrPass(gremlinStr, callback, singleObject) {
    if (callback) return this.executeQuery(gremlinStr, this, callback, singleObject);
    let response = Object.create(this);
    response.gremlinStr = gremlinStr;
    return response;
  }

  /**
  * Limits the number of results returned
  * @param {number} num number of results to be returned
  */
  limit(num, callback) {
    let gremlinStr = this.getGremlinStr();
    gremlinStr += `.limit(${parseInt(num)})`;
    this.executeOrPass(gremlinStr, callback);
  }

  /**
  * Deletes an existing vertex or edge
  * @param {string} id id of the vertex or edge to be deleted
  */
  delete(id, callback) {
    let gremlinStr = this.getGremlinStr();
    gremlinStr += '.drop()';
    this.executeOrPass(gremlinStr, callback);
    // let gremlinStr = `g.V().has('id', '${id}').drop()`;
    // this.g.client.execute(gremlinStr, (err, result) => {
    //   if (err) {
    //     callback({'error': err});
    //     return;
    //   }
    //   let response = `${id} deleted successfully`;
    //   callback(null, response);
    // });
  }

  /**
  * Perform a cypher query and parse the results
  * @param {string} string
  * @param {boolean} raw
  */
  query(string, raw, callback) {
    let cb = callback;
    let returnRawData = raw;
    if (arguments.length < 3) {
      cb = arguments[1];
      returnRawData = false;
    }

    let gremlinStr = this.getGremlinStr();
    gremlinStr += string;
    if (!callback) return this.executeOrPass(gremlinStr, callback);
    if (raw) {
      let childClass = this;
      return this.g.client.execute(gremlinStr, (err, result) => {
        if (err) {
          callback({'error': err});
          return;
        }
        callback(null, result);
      });
    }
    return this.executeOrPass(gremlinStr, callback);
  }

  /**
  * Builds a command string to be executed or passed using props
  * @param {string} action e.g., 'has', 'property'
  * @param {object} props
  */
  actionBuilder(action, props) {
    let propsStr = '';
    let ifArr = '';

    const keys = Object.keys(props);
    keys.forEach(key => {
      if (Array.isArray(props[key])) {
        ifArr = `within(`;
        for (let i = 0; i < props[key].length; i += 1) {
          if (i === props[key].length - 1) {
            ifArr += `${this.stringifyValue(props[key][i])}))`;
          } else {
            ifArr += `${this.stringifyValue(props[key][i])},`;
          }
        }
        propsStr += `.${action}('${key}',${ifArr}`;
      } else {
        propsStr += `.${action}('${key}',${this.stringifyValue(props[key])})`;
      }
    });
    return propsStr;
  }

  /**
  * 
  */
  getGremlinStr() {
    if (this.gremlinStr && this.gremlinStr !== '') return this.gremlinStr;
    if (this.constructor.name === 'Array') {
      if (this.length === 0) return `g.V('nonexistent')`;
      let type = this[0].constructor.name.charAt(0);
      let ids = [];
      this.forEach((el) => ids.push(el.id));
      return `g.${type}("${ids.join('","')}")`;
    }
    if (this.id) return `g.${this.constructor.name.charAt(0)}('${this.id}')`;
    return '';
  }

  /**
  * Wraps '' around value if string and returns it
  */
  stringifyValue(value) {
    if (typeof value === 'string') {
      return `'${value}'`;
    } else {
      return `${value}`;
    }
  }

  /**
  * Checks whether the props object adheres to the schema model specifications
  * @param {object} schema
  * @param {object} props
  * @param {boolean} checkRequired should be true for create or createE
  */
  checkSchema(schema, props, checkRequired) {
    /////////gf
    return true;
    //////////gf
    const schemaKeys = Object.keys(schema);
    const propsKeys = Object.keys(props);
    const response = {};

    if (checkRequired) {
      for (let sKey of schemaKeys) {
        if (schema[sKey].required) {
          if (!props[sKey]) {
            response[sKey] = [`A valid value for '${sKey}' is required`];
          }
        }
      }
    }

    for (let pKey of propsKeys) {
      if (!schemaKeys.includes(pKey)) {
        response[pKey] = [`'${pKey}' is not part of the schema model`];
      }
      if (props[pKey]) {
        if (props[pKey].constructor !== schema[pKey].type) {
          if (schema[pKey].type === Date) {
            response[pKey] = [`'${pKey}' should be a date object`];
          } else {
            response[pKey] = [`'${pKey}' should be a ${typeof schema[pKey].type()}`];
          }
        }
      }
    }
    return response;
  }

  /**
  * 
  * @param {array} gremlinResponse
  * @param {object} childClass
  */
  familiarizeAndPrototype(gremlinResponse, childClass) {
    let data = [];
    gremlinResponse.forEach((grem) => {
      let object = Object.create(childClass);
      object.id = grem.id;
      object.label = grem.label;
      if (childClass.constructor.name === 'EdgeModel') {
        object.inV = grem.inV;
        object.outV = grem.outV
        if (grem.inVLabel) object.inVLabel = grem.inVLabel;
        if (grem.outVLabel) object.outVLabel = grem.outVLabel;
      }

      let currentPartition = this.g.partition ? this.g.partition : '';
      if (grem.properties) {
        Object.keys(grem.properties).forEach((propKey) => {
          if (propKey != currentPartition) {
            if (childClass.constructor.name === 'EdgeModel') {
              object[propKey] = grem.properties[propKey];
            } else {
              object[propKey] = grem.properties[propKey][0].value;
            }
          }
        });
      }
      data.push(object);
    })
    childClass.addArrayMethods(data);
    return data;
  }

  /**
  * returns the id of the vertex or edge
  */
  getIdFromProps(props) {
    let idString = '';
    if (props.hasOwnProperty('id')) {
      if (Array.isArray(props.id)) {
        idString = `'${props.id.join(',')}'`;
      } else {
        idString = `'${props.id}'`;
      }
      delete props.id;
    }
    return idString;
  }

  /**
  * 
  */
  getRandomVariable(numVars, currentVarsArr) {
    const variables = currentVarsArr ? Array.from(currentVarsArr) : [];
    const variablesRequired = numVars ? numVars : 1;
    const possibleChars = 'abcdefghijklmnopqrstuvwxyz';
    function getRandomChars() {
      let result = '';
      for(let i = 0; i < 3; i += 1) {
        result += possibleChars[Math.floor(Math.random() * possibleChars.length)];
      }
      return result;
    }
    for (let i = 0; i < variablesRequired; i += 1) {
      let newVariable = getRandomChars();
      while (variables.includes(newVariable)) {
        newVariable = getRandomChars();
      }
      variables.push(newVariable);
    }
    return variables;
  }

  /**
  * Updates specific props on an existing vertex or edge
  */
  update(props, callback) {
    let gremlinStr = this.getGremlinStr();
    const schema = this.schema;
    const checkSchemaResponse = this.checkSchema(schema, props, false);

    if (Object.keys(checkSchemaResponse).length !== 0) return callback(checkSchemaResponse); // should it throw an error?

    gremlinStr += this.actionBuilder('property', props);
    return this.executeOrPass(gremlinStr, callback);
  }

  /**
  * Attaches array methods for later use 
  */
  addArrayMethods(arr) {
    if (this.constructor.name === 'VertexModel') {
      arr.createE = this.createE;
      arr.findE = this.findE;
      arr.findImplicit = this.findImplicit;
    }
    else if (this.constructor.name === 'EdgeModel') {
      arr.findV = this.findV;
    }
    arr.order = this.order;
    arr.limit = this.limit;
    arr.delete = this.delete;
    arr.query = this.query;
    arr.getGremlinStr = this.getGremlinStr;
    arr.executeOrPass = this.executeOrPass.bind(this);
  }
}



module.exports = Model;
