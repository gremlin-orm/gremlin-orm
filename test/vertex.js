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

describe('Vertex Model', () => {
  beforeEach(done => {
    g.queryRaw('g.V().drop()', () => {done()});
  });
  describe('Define', () => {
    it('Should define a new vertex model called Person', () => {
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

  describe('CreateEdge', () => {
    it('Should create an edge between two vertices', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
          john.createEdge(Knows, {'duration': 1}, result, (err, results) => {
            expect(results).to.have.lengthOf(1);
            expect(results[0].duration).to.equal(1);
            done();
          });
        });
      });
    });
    it('Should not create an edge with invalid properties', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
          john.createEdge(Knows, {'duration': 'abc'}, result, (err, results) => {
            expect(results).to.equal(undefined);
            done();
          });
        });
      });
    });
    it('Should create an edge with a not yet defined edge model label', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
          john.createEdge('likes', {'duration': 'abc'}, result, (err, results) => {
            expect(results).to.have.lengthOf(1);
            expect(results[0].findVertex).to.be.a('function');
            expect(results[0].label).to.equal('likes');
            expect(results[0].duration).to.equal('abc');
            done();
          });
        });
      });
    });
    it('Should not create an edge when no Out vertex gremlinStr', (done) => {
      Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        Person.createEdge(Knows, {}, result, (err, result) => {
          expect(err).to.not.equal(null);
          expect(err).to.not.equal(undefined);
          done();
        })
      });
    });
    it('Should not create an edge when no In vertex gremlinStr', (done) => {
      Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        result.createEdge(Knows, {}, Person, (err, result) => {
          expect(err).to.not.equal(null);
          expect(err).to.not.equal(undefined);
          done();
        })
      });
    });
  });

  describe('Find', () => {
    it('Should find a vertex with matching parameters', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        Person.find({'name': 'John', 'age': 20, 'dob': '12/18/1999', 'developer': true}, (err, result) => {
          expect(result).to.have.property('name');
          expect(result).to.have.property('age');
          expect(result.name).to.equal('John');
          done();
        });
      });
    });
  });

  describe('FindAll', () => {
    it('Should find multiple vertices with matching parameters', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          Person.findAll({'age': 20, 'developer': true}, (err, results) => {
            expect(results).to.have.lengthOf(2);
            expect(results[1].name).to.equal('Jane');
            done();
          });
        });
      });
    });
  });

  describe('FindRelated', () => {
    it('Should find related vertices', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 1}, jane, (err, results) => {
            john.findRelated(Knows, {}, 1, (err, results) => {
              expect(results[0].name).to.equal('Jane');
              done();
            });
          });
        });
      });
    });
    it('Should find only related vertices with matching parameters', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 1}, jane, (err, results) => {
            Person.create({'name': 'Jack', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              john.createEdge(Knows, {'duration': 2}, result, (err, results) => {
                john.findRelated(Knows, {'duration': 1}, 1, (err, results) => {
                  expect(results[0].name).to.equal('Jane');
                  expect(results).to.have.lengthOf(1);
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('Should find related vertices at specified depth', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 2}, jane, (err, results) => {
            Person.create({'name': 'Jack', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              jane.createEdge(Knows, {'duration': 2}, result, (err, results) => {
                john.findRelated(Knows, {}, 2, (err, results) => {
                  expect(results[0].name).to.equal('Jack');
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('Should find related vertices with non-defined edge label', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge('likes', {}, jane, (err, results) => {
            john.findRelated('likes', {}, 1, (err, results) => {
              expect(results[0].name).to.equal('Jane');
              done();
            });
          });
        });
      });
    });
  });

  describe('FindEdge', () => {
    it('Should find attached edges in both directions', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 2}, jane, (err, results) => {
            Person.create({'name': 'Jack', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              jane.createEdge(Knows, {'duration': 2}, result, (err, results) => {
                jane.findEdge(Knows, {}, (err, results) => {
                  expect(results).to.have.lengthOf(2);
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('Should find only attached edges with matching properties', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 1}, jane, (err, results) => {
            Person.create({'name': 'Jack', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              john.createEdge(Knows, {'duration': 2}, result, (err, results) => {
                john.findEdge(Knows, {'duration': 2}, (err, results) => {
                  expect(results).to.have.lengthOf(1);
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('Should find edges with non-defined label', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge('likes', {}, jane, (err, results) => {
            john.findEdge('likes', {}, (err, results) => {
              expect(results).to.have.lengthOf(1);
              expect(results[0].label).to.equal('likes');
              done();
            });
          });
        });
      });
    });
  });

  describe('FindImplicit', () => {
    it('Should find one implicitly related vertex', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 2}, jane, (err, results) => {
            Person.create({'name': 'Joe', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              result.createEdge(Knows, {'duration': 3}, jane, (err, results) => {
                john.findImplicit(Knows, {}, (err, results) => {
                  expect(results[0].name).to.equal('Joe');
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('Should find only implicit vertices with matching properties', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 1}, jane, (err, results) => {
            Person.create({'name': 'James', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              result.createEdge(Knows, {'duration': 1}, jane, (err, results) => {
                Person.create({'name': 'Joe', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
                  result.createEdge(Knows, {'duration': 3}, jane, (err, results) => {
                    john.findImplicit(Knows, {'duration': 1}, (err, results) => {
                      expect(results[0].name).to.equal('James');
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    it('Should find multiple implicitly related vertices', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge(Knows, {'duration': 2}, jane, (err, results) => {
            Person.create({'name': 'James', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              result.createEdge(Knows, {'duration': 1}, jane, (err, results) => {
                Person.create({'name': 'Joe', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
                  result.createEdge(Knows, {'duration': 3}, jane, (err, results) => {
                    john.findImplicit(Knows, {}, (err, results) => {
                      expect(results).to.have.lengthOf(2);
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    it('Should find implicitly related by non-defined edge label', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        let john = result;
        Person.create({'name': 'Jane', 'age': 20, 'dob': '12/18/1998', developer: true}, (err, result) => {
          let jane = result;
          john.createEdge('likes', {}, jane, (err, results) => {
            Person.create({'name': 'Joe', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
              result.createEdge('likes', {}, jane, (err, results) => {
                john.findImplicit('likes', {}, (err, results) => {
                  expect(results[0].name).to.equal('Joe');
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
  describe('Azure Create', () => {
    const ag = new gremlinOrm(['azure', 'partitionName']);
    const User = ag.define('user', {
      'name': {
        type: g.STRING,
        required: true
      }
    });
    beforeEach(done => {
      ag.queryRaw('g.V().drop()', () => {done()});
    });
    it('Should add partition name to gremlin query', done => {
      User.create({'name': 'John'}, (err, result) => {
        User.find({'partitionName': 'John'}, (err, result) => {
          expect(result.name).to.equal('John');
          done();
        });
      });
    });
  });
});
