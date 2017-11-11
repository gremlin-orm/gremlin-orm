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

describe('Vertex Model', () => {
  before(done => {
    g.queryRaw('g.V().drop()', () => {done();});
  });
  describe('Define', () => {
    it('Should define a new model called Person', () => {
      expect(Person.createEdge).to.be.a('function');
    });
  });

  describe('Create', () => {
    it('Should create a new vertex with valid parameters', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
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
    it('Should not create new vertex if date type prop is wrong', (done) => {
      Person.create({'name': 'John', 'dob': 'abc'}, (err, result) => {
          expect(result).to.equal(undefined);
          // expect(result).to.have.property('age');
          // expect(result.name).to.equal('John');
        done();
      });
    });
    it('Should not create new vertex if boolean type prop is wrong', (done) => {
      Person.create({'name': 'John', 'developer': 'abc'}, (err, result) => {
          expect(result).to.equal(undefined);
          // expect(result).to.have.property('age');
          // expect(result.name).to.equal('John');
        done();
      });
    });
  });

  describe('Find', () => {
    it('Should find a vertex with matching parameters', (done) => {
      Person.find({'name': 'John', 'age': 20, 'dob': '12/18/1999', 'developer': true}, (err, result) => {
          expect(result).to.have.property('name');
          expect(result).to.have.property('age');
          expect(result.name).to.equal('John');
        done();
      });
    });
  });
});
