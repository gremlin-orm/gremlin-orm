const gremlinOrm = require('./../src/gremlin-orm');
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
describe('gremlin-orm', () => {
  describe('Initialization', () => {
    it('Should have constants for data types', () => {
      expect(g.STRING).to.equal('string');
      expect(g.NUMBER).to.equal('number');
      expect(g.BOOLEAN).to.equal('boolean');
      expect(g.DATE).to.equal('date');
    });
  });
  describe('defineVertex', () => {
    it('Should exist on gremlin-orm level', () => {
      expect(g.defineVertex).to.be.a('function');
    });
    it('Should define a new vertex model', () => {
      const Person = g.defineVertex('person', {'name': {type: g.STRING, required: true }});
      expect(Person.constructor.name).to.equal('VertexModel')
    });
    it('Should add the schema to the definedVertices on gremlin-orm', () => {
      const Person = g.defineVertex('person', {'name': {type: g.STRING, required: true }});
      expect(g.definedVertices['person']).to.not.equal(undefined);
      expect(g.definedVertices['person'].name.type).to.not.equal(undefined);
    });
    it('Should create a new vertex model with schema', () => {
      const Person = g.defineVertex('person', {'name': {type: g.STRING, required: true }, 'age': {type: g.NUMBER}});
      expect(Object.keys(Person.schema)).to.have.lengthOf(2);
    });
    it('Should create schema with required flag', () => {
      const Person = g.defineVertex('person', {'name': {type: g.STRING, required: true }});
      expect(Object.keys(Person.schema)[0]).to.equal('name');
      expect(Person.schema[Object.keys(Person.schema)[0]].required).to.equal(true);
    });
    it('Should create schema with string type', () => {
      const Person = g.defineVertex('person', {'name': {type: g.STRING, required: true }});
      expect(Object.keys(Person.schema)[0]).to.equal('name');
      expect(Person.schema[Object.keys(Person.schema)[0]].type).to.equal('string');
    });
    it('Should create schema with number type', () => {
      const Person = g.defineVertex('person', {'age': {type: g.NUMBER}});
      expect(Object.keys(Person.schema)[0]).to.equal('age');
      expect(Person.schema[Object.keys(Person.schema)[0]].type).to.equal('number');
    });
    it('Should create schema with date type', () => {
      const Person = g.defineVertex('person', {'dob': {type: g.DATE}});
      expect(Object.keys(Person.schema)[0]).to.equal('dob');
      expect(Person.schema[Object.keys(Person.schema)[0]].type).to.equal('date');
    });
    it('Should create schema with boolean type', () => {
      const Person = g.defineVertex('person', {'developer': {type: g.BOOLEAN}});
      expect(Object.keys(Person.schema)[0]).to.equal('developer');
      expect(Person.schema[Object.keys(Person.schema)[0]].type).to.equal('boolean');
    });
  });
  describe('define', () => {
    it('Should exist on gremlin-orm level', () => {
      expect(g.define).to.be.a('function');
    });
    it('Should define a new vertex model by calling defineVertex', () => {
      const Person = g.define('person', {'name': {type: g.STRING, required: true }});
      expect(Person.constructor.name).to.equal('VertexModel')
    });
  });
  describe('defineEdge', () => {
    it('Should exist on gremlin-orm level', () => {
      expect(g.defineEdge).to.be.a('function');
    });
    it('Should define a new vertex model', () => {
      const Knows = g.defineEdge('knows', {'how': {type: g.STRING}});
      expect(Knows.constructor.name).to.equal('EdgeModel')
    });
    it('Should add the schema to the definedEdges on gremlin-orm', () => {
      const Knows = g.defineEdge('person', {'how': {type: g.STRING}});
      expect(g.definedEdges['knows']).to.not.equal(undefined);
      expect(g.definedEdges['knows'].how.type).to.not.equal(undefined);
    });
    it('Should create a new vertex model with schema', () => {
      const Knows = g.defineEdge('knows', {'how': {type: g.STRING}, 'friends': {type: g.BOOLEAN}});
      expect(Object.keys(Knows.schema)).to.have.lengthOf(2);
    });
    it('Should create schema with required flag', () => {
      const Knows = g.defineEdge('knows', {'duration': {type: g.NUMBER, required: true }});
      expect(Object.keys(Knows.schema)[0]).to.equal('duration');
      expect(Knows.schema[Object.keys(Knows.schema)[0]].required).to.equal(true);
    });
    it('Should create schema with string type', () => {
      const Knows = g.defineEdge('knows', {'how': {type: g.STRING}});
      expect(Object.keys(Knows.schema)[0]).to.equal('how');
      expect(Knows.schema[Object.keys(Knows.schema)[0]].type).to.equal('string');
    });
    it('Should create schema with number type', () => {
      const Knows = g.defineEdge('knows', {'duration': {type: g.NUMBER, required: true}});
      expect(Object.keys(Knows.schema)[0]).to.equal('duration');
      expect(Knows.schema[Object.keys(Knows.schema)[0]].type).to.equal('number');
    });
    it('Should create schema with date type', () => {
      const Knows = g.defineEdge('knows', {'anniversary': {type: g.DATE}});
      expect(Object.keys(Knows.schema)[0]).to.equal('anniversary');
      expect(Knows.schema[Object.keys(Knows.schema)[0]].type).to.equal('date');
    });
    it('Should create schema with boolean type', () => {
      const Knows = g.defineEdge('knows', {'friends': {type: g.BOOLEAN}});
      expect(Object.keys(Knows.schema)[0]).to.equal('friends');
      expect(Knows.schema[Object.keys(Knows.schema)[0]].type).to.equal('boolean');
    });
  });
});
