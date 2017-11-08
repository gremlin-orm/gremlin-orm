class Model {
  constructor(gorm, qremlinStr) {
    this.g = gorm;
    this.gremlinStr = gremlinStr;
  }

  executeQuery(query, parentClass, callback) {
    parentClass.g.client.execute(query, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      // Create nicer Object
      let response = familiarizeAndPrototype(result, parentClass);

      callback(null, response);
    });
  }

  delete(id, callback) {
    let gremlinStr = `g.V().has('id', '${id}').drop()`;
    this.g.client.execute(gremlinStr, (err, result) => {
      if (err) {
        callback({'error': err});
        return;
      }
      let response = `${id} deleted successfully`;
      callback(null, response);
    });
  }

  actionBuilder(action, props) {
    let propsStr = '';
    const keys = Object.keys(props);
    keys.forEach(key => propsStr += `.${action}('${key}',${this.stringifyValue(props[key])})`);
    return propsStr;
  }

  stringifyValue(value) {
    if (typeof value === 'string') {
      return `'${value}'`;
    } else {
      return `${value}`;
    }
  }

  checkSchema(schema, props, checkRequired) {
    const schemaKeys = Object.keys(schema);
    const propsKeys = Object.keys(props);
    if (checkRequired) {
      for (let i = 0; i < schemaKeys.length; i += 1) {
        let key = schemaKeys[i];
        if ((schema[key].allowNull !== undefined) && (schema[key].allowNull === false)) {
          if (!propsKeys.includes(key)) return false;
        }
      }
    }
    for (let i = 0; i < propsKeys.length; i += 1) {
      let key = propsKeys[i];
      if (!schemaKeys.includes(key)) return false;
      if (props[key].constructor !== schema[key].type) return false;
    }
    return true;
  }
}

const familiarizeAndPrototype = (gremlinResponse, parentClass) => {
  parentClass = parentClass || this;
  let data = [];
  gremlinResponse.forEach((grem) => {
    let object = Object.create(parentClass);
    object.id = grem.id;
    object.label = grem.label;
    let currentPartition = parentClass.partition ? parentClass.partition : '';

    Object.keys(grem.properties).forEach((propKey) => {
      if (propKey != currentPartition) {
        object[propKey] = grem.properties[propKey][0].value;
      }
    });
    data.push(object);
  })
  return data;
}

module.exports = Model;
