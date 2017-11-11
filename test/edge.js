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

});
