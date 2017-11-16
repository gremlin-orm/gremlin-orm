/**
* @param {object} gorm
* @param {string} gremlinStr
*/
class Model {
  constructor(gorm, gremlinStr) {
    this.g = gorm;
    this.gremlinStr = gremlinStr;
    this.checkModels = false;
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
    this.checkModels = true;
    let gremlinStr = this.getGremlinStr();
    gremlinStr += string;
    if (!cb) return this.executeOrPass(gremlinStr, cb);
    if (returnRawData) {
      this.checkModels = false;
      this.g.client.execute(gremlinStr, (err, result) => {
        if (err) {
          cb({'error': err});
          return;
        }
        cb(null, result);
      });
    }
    else return this.executeOrPass(gremlinStr, cb);
  }

  /**
  * Updates specific props on an existing vertex or edge
  */
  update(props, callback) {
    let gremlinStr = this.getGremlinStr();
    const schema = this.schema;
    const checkSchemaResponse = this.checkSchema(schema, props);
    if (this.interpretCheckSchema(checkSchemaResponse)) return callback(checkSchemaResponse); // should it throw an error?
    gremlinStr += this.actionBuilder('property', props);
    return this.executeOrPass(gremlinStr, callback);
  }

  /**
  * Deletes an existing vertex or edge
  * @param {string} id id of the vertex or edge to be deleted
  */
  delete(callback) {
    let gremlinStr = this.getGremlinStr();
    gremlinStr += '.drop()';
    this.executeOrPass(gremlinStr, callback);
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
  * Limits the number of results returned
  * @param {number} num number of results to be returned
  */
  limit(num, callback) {
    let gremlinStr = this.getGremlinStr();
    gremlinStr += `.limit(${parseInt(num)})`;
    this.executeOrPass(gremlinStr, callback);
  }

  /**
  * Takes the built query string and executes it
  * @param {string} query query string to execute.
  * @param {object} singleObject
  */
  executeQuery(query, callback, singleObject) {
    this.g.client.execute(query, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      // Create nicer Object
      let executeBoundFamiliar = this.g.familiarizeAndPrototype.bind(this);
      let response = executeBoundFamiliar(result);
      if(singleObject && response.length > 0) {
        callback(null, response[0]);
        return;
      }
      callback(null, response);
    });
  }

  /**
  * Executes or passes a string of command
  * @param {string} gremlinStr
  * @param {object} singleObject
  */
  executeOrPass(gremlinStr, callback, singleObject) {
    if (callback) return this.executeQuery(gremlinStr, callback, singleObject);
    let response = Object.create(this);
    response.gremlinStr = gremlinStr;
    return response;
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
  * Attaches array methods for later use
  */
  addArrayMethods(arr) {
    if (this.constructor.name === 'VertexModel') {
      arr.createEdge = this.createEdge;
      arr.findEdge = this.findEdge;
      arr.findImplicit = this.findImplicit;
    }
    else if (this.constructor.name === 'EdgeModel') {
      arr.findVertex = this.findVertex;
    }
    arr.order = this.order;
    arr.limit = this.limit;
    arr.delete = this.delete;
    arr.query = this.query;
    arr.getGremlinStr = this.getGremlinStr;
    arr.executeOrPass = this.executeOrPass.bind(this);
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
    if (this.hasOwnProperty('id')) return `g.${this.constructor.name.charAt(0)}('${this.id}')`;
    return '';
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
 * Parses properties into their known types from schema model
 * @param {object} properties - properties object to parse
 */
  parseProps(properties, model) {
    let schema = model ? model.schema : this.schema;
    const props = {};
    Object.keys(schema).forEach((key) => {
      if (properties[key]) {
       switch (schema[key].type) {
         case 'number':
           props[key] = parseInt(properties[key]);
           if(Number.isNaN(props[key])) props[key] = null;
           break;
         case 'boolean':

           if (properties[key].toString() === 'true' || properties[key].toString() === 'false') {
             props[key] = properties[key].toString() === 'true';
           } else {
             props[key] = null;
           }
           break;
         case 'date':
           let millis = this.dateGetMillis(properties[key]);
           if (Number.isNaN(millis)) {
             millis = 666;
           }
           props[key] = millis;
           break;
         default:  //string
           props[key] = properties[key].toString();
       }
      }
    });
    return props;
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
  * Checks Date types and parses it into millis
  * @param {Date/String/Number} value - number string or date representing date
  */
  dateGetMillis(value) {
    let millis = NaN;
    if (value instanceof Date) {
      millis = value.getTime();
    } else {
      const strValue = value.toString();
      const isNum = /^\d+$/.test(strValue);
      if (isNum) {
        millis = parseInt(strValue);
      } else {
        millis = Date.parse(strValue);
      }
    }
    return millis;
  }

  /**
  * Checks whether the props object adheres to the schema model specifications
  * @param {object} schema
  * @param {object} props
  * @param {boolean} checkRequired should be true for create and update methods
  */
  checkSchema(schema, props, checkRequired) {
    const schemaKeys = Object.keys(schema);
    const propsKeys = Object.keys(props);
    const response = {};

    function addErrorToResponse(key, message) {
      if (!response[key]) response[key] = [];
      response[key].push(message);
    }

    if (checkRequired) {
      for (let sKey of schemaKeys) {
        if (schema[sKey].required) {
          if (!props[sKey]) {
            addErrorToResponse(sKey, `A valid value for '${sKey}' is required`);
          }
        }
      }
    }
    for (let pKey of propsKeys) {
      if (schemaKeys.includes(pKey)) {
        if (schema[pKey].type === this.g.DATE) {
          const millis = this.dateGetMillis(props[pKey]);
          if (Number.isNaN(millis)) {
            addErrorToResponse(pKey, `'${pKey}' should be a Date`);
          } else {
            props[pKey] = millis;  //known side-effect
          }
        } else {
          if(!(typeof props[pKey] === schema[pKey].type)) {
            addErrorToResponse(pKey, `'${pKey}' should be a ${schema[pKey].type}`);
          }
        }
      } else {
        addErrorToResponse(pKey, `'${pKey}' is not part of the schema model`);
      }
    }
    return response;
  }

  /**
   * returns true if response is an empty object and false if it contains any error message
   * @param {object} response return value from checkSchema
  */
  interpretCheckSchema(response) {
    if (Object.keys(response).length === 0) return false;
    return true;
  }
}



module.exports = Model;
