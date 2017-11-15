const gremlinOrm = require('./../dist/gremlin-orm');
const g = new gremlinOrm('neo4j');

const { assert, expect } = require('chai');

describe('Database', () => {
  beforeEach(done => {
    g.queryRaw('g.V().drop()', () => {done()});
  });
  describe('Initial State', () => {
    it('Should connect and have no objects', (done) => {
      g.queryRaw('g.V()', (err, result) => {
        expect(result).to.have.lengthOf(0);
        done();
      })
    });
  });
});
