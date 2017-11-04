module.exports = {
  
  hasProps: function(props) {
    let propsStr = '';
    const keys = Object.keys(props);
    keys.forEach(key => propsStr += `.property('${key}',${this.stringifyValue(props[key])})`);
    return propsStr;
  },

  stringifyValue: function(value) {
    if (typeof value === 'string') {
      return `'${value}'`;
    } else {
      return `${value}`;
    }
  }
}

