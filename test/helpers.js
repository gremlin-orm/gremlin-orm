const gremlinOrm = require('./../dist/gremlin-orm');
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
        let executeBoundFamiliar = g.familiarizeAndPrototype.bind(Person);
        let response = executeBoundFamiliar(result);
        expect(response.constructor.name).to.equal('Array');
        expect(response.createEdge).to.be.a('function');
        done();
      });
    });
    it('Should return array of vertex objects with vertex methods', done => {
      g.queryRaw(`g.addV('person').property('name','John').property('age', 24)`, (err, result) => {
        let executeBoundFamiliar = g.familiarizeAndPrototype.bind(Person);
        let response = executeBoundFamiliar(result);
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
            let executeBoundFamiliar = g.familiarizeAndPrototype.bind(Knows);
            let response = executeBoundFamiliar(result);
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
            let executeBoundFamiliar = g.familiarizeAndPrototype.bind(Knows);
            let response = executeBoundFamiliar(result);
            expect(response[0].duration).to.equal(1);
            expect(response[0].findVertex).to.be.a('function');
            done();
          });
        });
      });
    });
  });
  describe('executeQuery', () => {
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
    it('Should return gremlinStr from Gremlin string object', () => {
      
    });
  });
});
