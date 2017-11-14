const gremlinOrm = require('./../dist/gremlin-orm');
const g = new gremlinOrm('neo4j', '8182', '0.0.0.0');

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
  before(done => {
    g.queryRaw('g.V().drop()', () => {done();});
  });
  describe('familiarizeAndPrototype', () => {
    it('Should exist', () => {
      expect(g.familiarizeAndPrototype).to.be.a('function');
    });
  });

});
