const gremlinOrm = require('./../src/gremlin-orm');
const g = new gremlinOrm('neo4j');

const { assert, expect } = require('chai');

const Person = g.define('person', {
  'name': {
    type: g.STRING,
    required: true
  },
  'age' : {
    type: g.NUMBER
  },
  'dob' : {
    type: g.DATE
  },
  'developer' : {
    type: g.BOOLEAN
  }
});

const Knows = g.defineEdge('knows', {
  'duration': {
    type: g.NUMBER,
    required: true
  }
});

describe('Helpers', () => {
  beforeEach(done => {
    g.queryRaw('g.V().drop()', () => {done()});
  });

  describe('familiarizeAndPrototype', () => {
    it('Should return array with vertex methods', done => {
      g.queryRaw(`g.addV('person').property('name','John').property('age', 24)`, (err, result) => {
        let response = g.familiarizeAndPrototype.call(Person, result);
        expect(response.constructor.name).to.equal('Array');
        expect(response.createEdge).to.be.a('function');
        done();
      });
    });
    it('Should return array of vertex objects with vertex methods', done => {
      g.queryRaw(`g.addV('person').property('name','John').property('age', 24)`, (err, result) => {
        let response = g.familiarizeAndPrototype.call(Person, result);
        expect(response[0].name).to.equal('John');
        expect(response[0].createEdge).to.be.a('function');
        done();
      });
    });
    it('Should return array with edge methods', done => {
      g.queryRaw(`g.addV('person').property('name','John').property('age', 24)`, (err, result) => {
        let johnID = result[0].id;
        g.queryRaw(`g.addV('person').property('name','Jane').property('age', 24)`, (err, result) => {
          let janeID = result[0].id;
          g.queryRaw(`g.V(${johnID}).addE('knows').property('duration', 1).to(g.V(${janeID}))`, (err, result) => {
            let response = g.familiarizeAndPrototype.call(Knows, result);
            expect(response.constructor.name).to.equal('Array');
            expect(response.findVertex).to.be.a('function');
            done();
          });
        });
      });
    });
    it('Should return array of edge objects with edge methods', done => {
      g.queryRaw(`g.addV('person').property('name','John').property('age', 24)`, (err, result) => {
        let johnID = result[0].id;
        g.queryRaw(`g.addV('person').property('name','Jane').property('age', 24)`, (err, result) => {
          let janeID = result[0].id;
          g.queryRaw(`g.V(${johnID}).addE('knows').property('duration', 1).to(g.V(${janeID}))`, (err, result) => {
            let response = g.familiarizeAndPrototype.call(Knows, result);
            expect(response[0].duration).to.equal(1);
            expect(response[0].findVertex).to.be.a('function');
            done();
          });
        });
      });
    });
  });

  describe('executeQuery', () => {
    it('Should be available on Vertex and Edge models', () => {
      expect(Person.executeQuery).to.be.a('function');
      expect(Knows.executeQuery).to.be.a('function');
    });
    it('Should send query to database and return array of results', done => {
      g.queryRaw(`g.addV('person').property('name','John').property('age', 24)`, (err, result) => {
        query = `g.V().hasLabel('person').has('name','John')`;
        const callback = (err, response) => {
          expect(err).to.equal(null);
          expect(response).to.have.lengthOf(1);
          done();
        }
        Person.executeQuery(query, callback);
      });
    });
    it('Should send query to database and return single object when singleObject is true', done => {
      g.queryRaw(`g.addV('person').property('name','John').property('age', 24)`, (err, result) => {
        query = `g.V().hasLabel('person').has('name','John')`;
        const callback = (err, response) => {
          expect(err).to.equal(null);
          expect(response.name).to.equal('John');
          done();
        }
        Person.executeQuery(query, callback, true);
      });
    });
  });

  describe('executeOrPass', () => {
    it('Should be available on Vertex and Edge models', () => {
      expect(Person.executeOrPass).to.be.a('function');
      expect(Knows.executeOrPass).to.be.a('function');
    });
    it('Should send query to database and return array of results when callback present', done => {
      g.queryRaw(`g.addV('person').property('name','John').property('age', 24)`, (err, result) => {
        query = `g.V().hasLabel('person').has('name','John')`;
        const callback = (err, response) => {
          expect(err).to.equal(null);
          expect(response).to.have.lengthOf(1);
          done();
        }
        Person.executeOrPass(query, callback);
      });
    });
    it('Should return Gremlin string chainable object if no callback present', done => {
      g.queryRaw(`g.addV('person').property('name','John').property('age', 24)`, (err, result) => {
        query = `g.V().hasLabel('person').has('name','John')`;
        let obj = Person.executeOrPass(query);
        expect(obj.gremlinStr).to.equal(`g.V().hasLabel('person').has('name','John')`);
        expect(obj.findRelated).to.be.a('function');
        done();
      });
    });
  });

  describe('actionBuilder', () => {
    it('Should be available on Vertex and Edge models', () => {
      expect(Person.actionBuilder).to.be.a('function');
      expect(Knows.actionBuilder).to.be.a('function');
    });
    it('Should ignore id property from props object', () => {
      let string = Person.actionBuilder('property', {'id': 123, 'name': 'John'});
      expect(string).to.equal(`.property('name','John')`);
    });
    it('Should return query string with action and props', () => {
      let string = Person.actionBuilder('property', {'name': 'John'});
      expect(string).to.equal(`.property('name','John')`);
    });
    it('Should not add quotes around number values', () => {
      let intString = Person.actionBuilder('property', {'age': 20});
      expect(intString).to.equal(`.property('age',20)`);
      let floatString = Person.actionBuilder('property', {'age': 20.2});
      expect(floatString).to.equal(`.property('age',20.2)`);
    });
    it('Should not add quotes around boolean values', () => {
      let trueString = Person.actionBuilder('property', {'developer': true});
      expect(trueString).to.equal(`.property('developer',true)`);
      let falseString = Person.actionBuilder('property', {'developer': false});
      expect(falseString).to.equal(`.property('developer',false)`);
    });
    it('Should create within clauses for array values', () => {
      let string = Person.actionBuilder('property', {'name': ['John', 'Jane']});
      expect(string).to.equal(`.property('name',within('John','Jane'))`);
    });
  });

  describe('addArrayMethods', () => {
    it('Should be available on Vertex and Edge models', () => {
      expect(Person.addArrayMethods).to.be.a('function');
      expect(Knows.addArrayMethods).to.be.a('function');
    });
    it('Should add general methods to array', () => {
      let arr = ['test'];
      Person.addArrayMethods(arr);
      expect(arr.order).to.be.a('function');
    });
    it('Should add vertex methods when called with vertex', () => {
      let arr = ['test'];
      Person.addArrayMethods(arr);
      expect(arr.findEdge).to.be.a('function');
      expect(arr.findVertex).to.equal(undefined);
    });
    it('Should add edge methods when called with edge', () => {
      let arr = ['test'];
      Knows.addArrayMethods(arr);
      expect(arr.findVertex).to.be.a('function');
      expect(arr.findEdge).to.equal(undefined);
    });
  });

  describe('getGremlinStr', () => {
    it('Should be available on Vertex and Edge models', () => {
      expect(Person.getGremlinStr).to.be.a('function');
      expect(Knows.getGremlinStr).to.be.a('function');
    });
    it('Should return gremlinStr from Gremlin string object', () => {
      let str = Person.find({'name': 'John'}).getGremlinStr();
      expect(str).to.equal(`g.V().hasLabel('person').has('name','John').limit(1)`);
    });
    it('Should return gremlinStr from familiarized object', done => {
      Person.create({'name': 'John', 'age': 20}, (err, result) => {
        expect(result.getGremlinStr()).to.equal(`g.V('${result.id}')`);
        done();
      });
    });
    it('Should return gremlinStr from an array of familiarized object', done => {
      Person.create({'name': 'John', 'age': 20}, (err, result) => {
        let john = result
        Person.create({'name': 'Jane', 'age': 20}, (err, result) => {
          let jane = result;
          Person.findAll({}, (err, results) => {
            expect(results.getGremlinStr()).to.equal(`g.V("${results.map(el => el.id).join('","')}")`);
            done();
          });
        });
      });
    });
  });

  describe('getIdFromProps', () => {
    it('Should be available on Vertex and Edge models', () => {
      expect(Person.getIdFromProps).to.be.a('function');
      expect(Knows.getIdFromProps).to.be.a('function');
    });
    it('Should not change props object if no id key', () => {
      let props = {'name': 'John', 'age': 20};
      let originalPropsLength = Object.keys(props).length;
      Person.getIdFromProps(props);
      expect(Object.keys(props)).to.have.lengthOf(originalPropsLength);
    });
    it('Should return a empty string if no id key is present', () => {
      let props = {'name': 'John', 'age': 20};
      let string = Person.getIdFromProps(props);
      expect(string).to.equal('');
    });
    it('Should return a single ID from props object', () => {
      let props = {'id': 1, 'name': 'John', 'age': 20};
      let string = Person.getIdFromProps(props);
      expect(string).to.equal("'1'");
    });
    it('Should return a multiple IDs from props object with id array', () => {
      let props = {'id': [1,2,3], 'name': 'John', 'age': 20};
      let string = Person.getIdFromProps(props);
      expect(string).to.equal("'1,2,3'");
    });
  });

  describe('getRandomVariable', () => {
    it('Should be available on Vertex and Edge models', () => {
      expect(Person.getRandomVariable).to.be.a('function');
      expect(Knows.getRandomVariable).to.be.a('function');
    });
    it('Should return an array of one variable', () => {
      let arr = Person.getRandomVariable(1, []);
      expect(arr).to.have.lengthOf(1);
      expect(typeof arr[0]).to.equal('string');
    });
    it('Should return an array of multiple unique variables', () => {
      let arr = Person.getRandomVariable(2, []);
      expect(arr).to.have.lengthOf(2);
      expect(arr[0]).to.not.equal(arr[1]);
    });
    it('Should return a variable not in the current variables array', () => {
      let arr = Person.getRandomVariable(1, ['abc']);
      expect(arr).to.have.lengthOf(2);
      expect(arr[0]).to.equal('abc');
      expect(arr[1]).to.not.equal('abc');
    });
    it('Should never return two of the same variables', () => {
      let arr = [];
      for(let i = 0; i < 30; i += 5 ) {
        arr = Person.getRandomVariable(5, arr);
      }
      expect(arr.length).to.equal(26);
    });
  });

  describe('dateGetMillis', () => {
    it('Should be available on Vertex and Edge models', () => {
      expect(Person.dateGetMillis).to.be.a('function');
      expect(Knows.dateGetMillis).to.be.a('function');
    });
    it('Should convert a Date object to integer time', () => {
      expect(typeof Person.dateGetMillis(new Date('12/18/1999'))).to.equal('number');
    });
    it('Should convert a Date compatible string to integer time', () => {
      expect(typeof Person.dateGetMillis('12/18/1999')).to.equal('number');
    });
    it('Should convert a numeric string directly to integer', () => {
      expect(Person.dateGetMillis('945504000000')).to.equal(945504000000);
    });
    it('Should return NaN for incompatible strings', () => {
      expect(Number.isNaN(Person.dateGetMillis('hello'))).to.equal(true);
    });
  });

  describe('parseProps', () => {
    it('Should be available on Vertex and Edge models', () => {
      expect(Person.parseProps).to.be.a('function');
      expect(Knows.parseProps).to.be.a('function');
    });
    it('Should return a new props object', () => {
      let properties = {'name': 'John', 'age': 20, 'dob': '12/18/1999', 'developer': true};
      let props = Person.parseProps(properties);
      expect(props.hasOwnProperty('name')).to.equal(true);
    });
    it('Should remove a key that is not available in schema', () => {
      let properties = {'name': 'John', 'age': 20, 'dob': '12/18/1999', 'developer': true};
      let props = Person.parseProps(properties);
      expect(props.hasOwnProperty('name')).to.equal(true);
      expect(props.hasOwnProperty('hello')).to.equal(false);
    });
    it('Should cast a number string into a number if the schema type is number', () => {
      let properties = {'name': 'John', 'age': '20', 'dob': '12/18/1999', 'developer': true};
      let props = Person.parseProps(properties);
      expect(props.age).to.equal(20);
    });
    it('Should cast a string true into a boolean true if the schema type is boolean', () => {
      let properties = {'name': 'John', 'age': 20, 'dob': '12/18/1999', 'developer': 'true'};
      let props = Person.parseProps(properties);
      expect(props.developer).to.equal(true);
    });
    it('Should cast a string false into a boolean false if the schema type is boolean', () => {
      let properties = {'name': 'John', 'age': 20, 'dob': '12/18/1999', 'developer': 'false'};
      let props = Person.parseProps(properties);
      expect(props.developer).to.equal(false);
    });
    it('Should cast an incorrect boolean type to null', () => {
      let properties = {'name': 'John', 'age': 20, 'dob': '12/18/1999', 'developer': 13};
      let props = Person.parseProps(properties);
      expect(props.developer).to.equal(null);
    });
    it('Should cast a string date into an integer date if the schema type is date', () => {
      let properties = {'name': 'John', 'age': 20, 'dob': '12/18/1999', 'developer': 'false'};
      let props = Person.parseProps(properties);
      expect(typeof props.dob).to.equal('number');
    });
    it('Should cast an incorrect date type into null', () => {
      let properties = {'name': 'John', 'age': 20, 'dob': 'hello', 'developer': 'false'};
      let props = Person.parseProps(properties);
      expect(props.dob).to.equal(null);
    });
    it('Should return a string value if schema type is string', () => {
      let properties = {'name': true, 'age': 20, 'dob': '12/18/1999', 'developer': 'false'};
      let props = Person.parseProps(properties);
      expect(props.name).to.equal('true');
    });
    it('Should return a array value if array is passed in', () => {
      let properties = {'name': ['John', 'Jane']};
      let props = Person.parseProps(properties);
      expect(Array.isArray(props.name)).to.equal(true);
    });
    it('Should cast values within arrays', () => {
      let properties = {'name': [18, 19]};
      let props = Person.parseProps(properties);
      expect(Array.isArray(props.name)).to.equal(true);
      expect(props.name[0]).to.equal('18');
      expect(props.name[1]).to.equal('19');
    });
  });

  describe('stringifyValue', () => {
    it('Should be available on Vertex and Edge models', () => {
      expect(Person.stringifyValue).to.be.a('function');
      expect(Knows.stringifyValue).to.be.a('function');
    });
    it('Should return a string with quotes if the input is a string', () => {
      expect(Person.stringifyValue('string')).to.equal("'string'");
    });
    it('Should return a string without quotes if the input is a number', () => {
      expect(Person.stringifyValue(20)).to.equal("20");
    });
    it('Should return a string without quotes if the input is a boolean', () => {
      expect(Person.stringifyValue(true)).to.equal("true");
    });
  });

  describe('checkSchema', () => {
    it('Should be available on Vertex and Edge models', () => {
      expect(Person.checkSchema).to.be.a('function');
      expect(Knows.checkSchema).to.be.a('function');
    });
    it('Should return an empty object if all checks pass', () => {
      let properties = {'name': 'John', 'age': 20, 'dob': '12/18/1999', 'developer': true};
      let obj = Person.checkSchema(Person.schema, properties, true);
      expect(Object.keys(obj)).to.have.lengthOf(0);
    });
    it('Should check required properties if checkRequired is true', () => {
      let properties = {'age': 20, 'dob': '12/18/1999', 'developer': true};
      let obj = Person.checkSchema(Person.schema, properties, true);
      expect(Object.keys(obj)).to.have.lengthOf(1);
      expect(obj[Object.keys(obj)[0]][0]).to.equal(`A valid value for 'name' is required`);
    });
    it('Should not check required properties if checkRequired is false', () => {
      let properties = {'age': 20, 'dob': '12/18/1999', 'developer': true};
      let obj = Person.checkSchema(Person.schema, properties, false);
      expect(Object.keys(obj)).to.have.lengthOf(0);
    });
    it('Should return error if string type is wrong', () => {
      let properties = {'name': 20, 'age': 20, 'dob': '12/18/1999', 'developer': true};
      let obj = Person.checkSchema(Person.schema, properties, false);
      expect(Object.keys(obj)).to.have.lengthOf(1);
      expect(Object.keys(obj)[0]).to.equal('name');
      expect(obj[Object.keys(obj)[0]][0]).to.equal(`'name' should be a string`);
    });
    it('Should return error if number type is wrong', () => {
      let properties = {'name': 'John', 'age': '20', 'dob': '12/18/1999', 'developer': true};
      let obj = Person.checkSchema(Person.schema, properties, false);
      expect(Object.keys(obj)).to.have.lengthOf(1);
      expect(Object.keys(obj)[0]).to.equal('age');
      expect(obj[Object.keys(obj)[0]][0]).to.equal(`'age' should be a number`);
    });
    it('Should return error if date type is wrong', () => {
      let properties = {'name': 'John', 'age': 20, 'dob': 'hello', 'developer': true};
      let obj = Person.checkSchema(Person.schema, properties, false);
      expect(Object.keys(obj)).to.have.lengthOf(1);
      expect(Object.keys(obj)[0]).to.equal('dob');
      expect(obj[Object.keys(obj)[0]][0]).to.equal(`'dob' should be a Date`);
    });
    it('Should return error if boolean type is wrong', () => {
      let properties = {'name': 'John', 'age': 20, 'dob': '12/18/1999', 'developer': 'true'};
      let obj = Person.checkSchema(Person.schema, properties, false);
      expect(Object.keys(obj)).to.have.lengthOf(1);
      expect(Object.keys(obj)[0]).to.equal('developer');
      expect(obj[Object.keys(obj)[0]][0]).to.equal(`'developer' should be a boolean`);
    });
    it('Should return multiple errors for multiple wrong values', () => {
      let properties = {'name': 20, 'age': '20', 'dob': 'hello', 'developer': 'true'};
      let obj = Person.checkSchema(Person.schema, properties, false);
      expect(Object.keys(obj)).to.have.lengthOf(4);
    });
  });

  describe('checkSchemaFailed', () => {
    it('Should be available on Vertex and Edge models', () => {
      expect(Person.checkSchemaFailed).to.be.a('function');
      expect(Knows.checkSchemaFailed).to.be.a('function');
    });
    it('Should return true if there are errors', () => {
      let response = {'name': ['should be a string']};
      expect(Person.checkSchemaFailed(response)).to.equal(true);
    });
    it('Should return false if there are no errors', () => {
      let response = {};
      expect(Person.checkSchemaFailed(response)).to.equal(false);
    });
  });
});
