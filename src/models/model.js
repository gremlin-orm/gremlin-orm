class Model {
  constructor(gorm, gremlinStr) {
    this.g = gorm;
    this.gremlinStr = gremlinStr;
  }

  executeQuery(query, childClass, callback) {
    this.g.client.execute(query, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      // Create nicer Object
      let response = this.familiarizeAndPrototype(result, childClass);

      callback(null, response);
    });
  }

  executeOrPass(gremlinStr, childClass, callback) {
    if (callback) return this.executeQuery(gremlinStr, childClass, callback);
    let response = Object.create(childClass);
    response.gremlinStr = gremlinStr;
    return response;
  }

  limit(num, callback) {
    let gremlinStr = this.getGremlinStr();
    gremlinStr += `.limit(${parseInt(num)})`;
    this.executeOrPass(gremlinStr, this, callback);
  }

  delete(id, callback) {
    let gremlinStr = this.getGremlinStr();
    gremlinStr += '.drop()';
    this.executeOrPass(gremlinStr, this, callback);
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

  getGremlinStr() {
    if (this.gremlinStr !== '') return this.gremlinStr;
    if (this.id) return `g.V('${this.id}')`;
    return '';
  }

  stringifyValue(value) {
    if (typeof value === 'string') {
      return `'${value}'`;
    } else {
      return `${value}`;
    }
  }

  checkSchema(schema, props, checkRequired) {
    
    return true;

    const schemaKeys = Object.keys(schema);
    const propsKeys = Object.keys(props);

    if (checkRequired) {
      for (let i = 0; i < schemaKeys.length; i += 1) {
        let key = schemaKeys[i];
        if (schema[key].required) {
          if (!props[key]) return false;
        }
      }
    }

    for (let i = 0; i < propsKeys.length; i += 1) {
      let key = propsKeys[i];
      if (!schemaKeys.includes(key)) return false;
      if (props[key]) {
        if (props[key].constructor !== schema[key].type) return false;
      }
    }
    return true;
  }

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
    return data;
  }

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
}



module.exports = Model;
