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

let john;
let bob;

describe('Edge Model', () => {
  beforeEach(done => {
    g.queryRaw('g.V().drop()', () => {
      Person.create({'name': 'John', 'age': 18, 'dob': '12/18/1999', developer: true}, (err, result) => {
        john = result;
        Person.create({'name': 'Bob', 'age': 23, 'dob': '04/30/1994', developer: false}, (err, result) => {
          bob = result;
          done();
        });
      });
    });
  });
  
  describe('Define', () => {
    it('Should define a new edge model called Knows', () => {
      expect(Knows.create).to.be.a('function');
    });
  });

  describe('Create', () => {
    it('Should create a new edge with valid properties', (done) => {
      Knows.create(john, bob, {duration: 5}, (err, result) => {
        expect(result).to.have.property('id');
        expect(result.label).to.equal('knows');
        expect(result.duration).to.equal(5);
        expect(result).to.have.property('outV');
        expect(result).to.have.property('inV');
        done();
      });
    });
    it('Should not create an edge if required property type is incorrect', (done) => {
      Knows.create(john, bob, {duration: '123'}, (err, result) => {
        expect(result).to.equal(undefined);
        done();
      });
    });
  });

  describe('Find', () => {
    it('Should find and return the first edge with matching properties', (done) => {
      Person.create({'name': 'Sam', 'age': 38, 'dob': '12/18/1979', developer: true}, (err, result) => {
        sam = result;
        Knows.create(john, bob, {duration: 3}, (err, result) => {
          const id = result.id;
          const outV = result.outV;
          const inV = result.inV;
          Knows.create(bob, sam, {duration: 3}, (err, result) => {
            Knows.find({'duration': 3}, (err, result) => {
              expect(typeof result).to.equal('object');
              expect(!Array.isArray(result)).to.equal(true);
              expect(result.id).to.equal(id);
              expect(result.label).to.equal('knows');
              expect(result.inV).to.equal(inV);
              expect(result.outV).to.equal(outV);
              expect(result.inVLabel).to.equal('person');
              expect(result.outVLabel).to.equal('person');
              expect(result.duration).to.equal(3);
              done();
            });
          });
        });
      });
    });
    it('Should return an empty array if no match is found', (done) => {
      Person.create({'name': 'Sam', 'age': 38, 'dob': '12/18/1979', developer: true}, (err, result) => {
        sam = result;
        Knows.create(john, bob, {duration: 3}, (err, result) => {
          const id = result.id;
          const outV = result.outV;
          const inV = result.inV;
          Knows.create(bob, sam, {duration: 3}, (err, result) => {
            Knows.find({'duration': 10}, (err, result) => {
              expect(Array.isArray(result)).to.equal(true);
              expect(result.length).to.equal(0);
              done();
            });
          });
        });
      });
    });
  });

  describe('FindAll', () => {
    it('Should find and return all edges with matching properties', (done) => {
      Person.create({'name': 'Sam', 'age': 38, 'dob': '12/18/1979', developer: true}, (err, result) => {
        sam = result;
        Knows.create(john, bob, {duration: 3}, (err, result) => {
          const id1 = result.id;
          Knows.create(bob, sam, {duration: 3}, (err, result) => {
            const id2 = result.id;
            Knows.create(john, sam, {duration: 5}, (err, result) => {
              const id3 = result.id;
              Knows.findAll({'duration': 3}, (err, result) => {
                expect(Array.isArray(result)).to.equal(true);
                expect(result.length).to.equal(2);
                expect(result[0].id).to.equal(id1);
                expect(result[1].id).to.equal(id2);
                done();
              });
            });
          });
        });
      });
    });
    it('Should return an empty array if no match is found', (done) => {
      Person.create({'name': 'Sam', 'age': 38, 'dob': '12/18/1979', developer: true}, (err, result) => {
        sam = result;
        Knows.create(john, bob, {duration: 3}, (err, result) => {
          const id = result.id;
          const outV = result.outV;
          const inV = result.inV;
          Knows.create(bob, sam, {duration: 3}, (err, result) => {
            Knows.find({'duration': 10}, (err, result) => {
              expect(Array.isArray(result)).to.equal(true);
              expect(result.length).to.equal(0);
              done();
            });
          });
        });
      });
    });
  });

  // describe('FindVertex', () => {
  //   it('Should find and return all vertices connected by relevant edges with matching properties', (done) => {
  //     Person.create({'name': 'Sam', 'age': 38, 'dob': '12/18/1979', developer: true}, (err, result) => {
  //       sam = result;
  //       Knows.create(john, bob, {duration: 3}, (err, result) => {
  //         const id1 = result.id;
  //         Knows.create(bob, sam, {duration: 3}, (err, result) => {
  //           const id2 = result.id;
  //           Knows.create(john, sam, {duration: 5}, (err, result) => {
  //             const id3 = result.id;
  //             Knows.findAll({'duration': 3}, (err, result) => {
                
  //             })
  //           });
  //         });
  //       });
  //     });
  //   });
  // });
});
