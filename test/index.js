const gremlinOrm = require('./../dist/gremlin-orm');
const g = new gremlinOrm('neo4j');

const { assert, expect } = require('chai');

beforeEach((done) => {
  g.queryRaw('g.V().drop()', () => {done();});
})

describe('Database', () => {
  describe('Initial State', () => {
    it('Should connect and have no objects', (done) => {
      g.queryRaw('g.V()', (err, result) => {
        expect(result).to.have.lengthOf(0);
        done();
      })
    });
  });
});

const Person = g.define('person', {
  'name': {
    type: g.STRING,
    required: true
  },
  'age' : {
    type: g.NUMBER
  }
});

describe('VertexModel', () => {
  describe('Define', () => {
    it('Should define a new model called Person', () => {
      expect(Person.createEdge).to.be.a('function');
    });
  });

  describe('Create', () => {
    it('Should create a new vertex with valid parameters', (done) => {
      Person.create({'name': 'John', 'age': 20}, (err, result) => {
          expect(result).to.have.property('name');
          expect(result).to.have.property('age');
          expect(result.name).to.equal('John');
        done();
      });

    });
    it('Should not create new vertex if required parameter missing', (done) => {
      Person.create({'age': 20}, (err, result) => {
          expect(result).to.equal(undefined);
          // expect(result).to.have.property('age');
          // expect(result.name).to.equal('John');
        done();
      });

    });
    it('Should not create new vertex if number type prop is wrong', (done) => {
      Person.create({'name': 'John', 'age': '20'}, (err, result) => {
          expect(result).to.equal(undefined);
          // expect(result).to.have.property('age');
          // expect(result.name).to.equal('John');
        done();
      });

    });
  });
});

g.queryRaw('g.V().drop()', () => {});
