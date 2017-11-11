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

describe('Edge Model', () => {
  before(done => {
    g.queryRaw('g.V().drop()', () => {done();});
  });
  describe('Define', () => {
    it('Should define a new edge model called Knows', () => {
      expect(Knows.create).to.be.a('function');
    });
  });

  describe('Create', () => {
    it('Should create a new edge with valid parameters', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Bob', 'age': 25, 'dob': '04/30/1994', developer: false}, (err, result) => {
          let bob = result;
          Knows.create(john, bob, {duration: 5}, (err, result) => {
            expect(result.label).to.equal('knows');
            expect(result.duration).to.equal(5);
            done();
          });
        });
      });
    });
  });
});
