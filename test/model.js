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
  },
  'how' : {
    type: g.STRING
  },
  'anniversary' : {
    type: g.DATE
  },
  'friends' : {
    type: g.BOOLEAN
  }
});

describe('Model', () => {
  beforeEach(done => {
    g.queryRaw("g.V().drop()", () => {
      g.queryRaw("g.addV('person').property('name','Victoria').property('age', 12)", () => {
        g.queryRaw("g.addV('person').property('name','Samanatha').property('age', 47)", () => {
          let knowsProps = ".property('duration', 1).property('how', 'golf days')";
          knowsProps += ".property('anniversary', 1458101167000).property('duration', 1)";
          g.queryRaw(`g.V().has('name','Victoria').addE('knows')${knowsProps}.to(g.V().has('name','Samanatha'))`, () => {
            done();
          });      
        });    
      });  
    });
  });

 describe('Query', () => {
    it('Should be available on Vertex and Edge Models', () => {
      expect(Person.query).to.be.a('function');
      expect(Knows.query).to.be.a('function');
    });
    it('Should run a query on the database', (done) => {
      Person.query("g.V().hasLabel('person').has('name', 'Victoria')", (err, result) => {
        expect(result[0].name).to.equal('Victoria');
        done();
      });
    });
    it("Should return the results parsed into Model Objects if 'raw' is false or not provided", (done) => {
      Person.query("g.V().hasLabel('person').has('name', 'Victoria')", false, (err, result) => {
        expect(result[0]).to.be.an.instanceof(Person.constructor);
        Person.query("g.V().hasLabel('person').has('name', 'Victoria')", (err, result) => {
          expect(result[0]).to.be.an.instanceof(Person.constructor);
          expect(result[0].name).to.equal('Victoria');
          done();
        });  
      });
    });
    it("Should return the results in JSON format if 'raw' is true", (done) => {
      Person.query("g.V().hasLabel('person').has('name', 'Victoria')", true, (err, result) => {
        expect(result[0]).to.not.be.an.instanceof(Person.constructor);
        expect(result[0].properties.name).to.exist;
        done();
      });
    });
  });

  describe('Update', () => {
    it('Should be available on Vertex and Edge Models', () => {
      expect(Person.update).to.be.a('function');
      expect(Knows.update).to.be.a('function');
    });
    it('Should update properties on the database for Vertex Model', (done) => {
      Person.findAll({}).update({name: 'Tommy'}, (err, result) => {
        expect(result[0].name).to.equal('Tommy');
        expect(result[1].name).to.equal('Tommy');
        done();
      });
    });
    it('Should update properties on the database for a specific instance of Vertex Model', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        expect(result.name).to.equal('John');
        result.update({age: 14}, (err, result) => {
          expect(result[0].age).to.equal(14);
          Person.find({name: 'Victoria'}, (err, result) => {
            expect(result.age).to.equal(12  );
            done();
          });
        });     
      });
    });
    it('Should not update vertex if string type prop is wrong', (done) => {
      Person.findAll({name: 'Victoria'}).update({name: 7}, (err, result) => {
        expect(err).to.not.equal(null);
        done();
      });
    });
    it('Should not update vertex if number type prop is wrong', (done) => {
      Person.findAll({name: 'Victoria'}).update({age: '6'}, (err, result) => {
        expect(err).to.not.equal(null);
        done();
      });
    });
    it('Should not update vertex if date type prop is wrong', (done) => {
      Person.findAll({name: 'Victoria'}).update({dob: 'date'}, (err, result) => {
        expect(err).to.not.equal(null);
        done();
      }); 
    });
    it('Should not update vertex if boolean type prop is wrong', (done) => {
        Person.findAll({name: 'Victoria'}).update({developer: 3}, (err, result) => {
        expect(err).to.not.equal(null);
        done();
      }); 
    });
    it('Should not update vertex if prop is not in schema', (done) => {
        Person.findAll({name: 'Victoria'}).update({golf: true}, (err, result) => {
        expect(err).to.not.equal(null);
        done();
      }); 
    });
    it('Should update properties on the database for Edge Model', (done) => {
      g.queryRaw("g.addV('person').property('name','Peter').property('age', 22)", () => {
        g.queryRaw("g.V().has('name','Victoria').addE('knows').property('duration', 2).to(g.V().has('name','Peter'))", () => {
          Knows.findAll({}).update({duration: 5}, (err, result) => {
            expect(result.length).to.equal(2);  
            expect(result[0].duration).to.equal(5); 
            expect(result[1].duration).to.equal(5); 
            done();
          });      
        });      
      });
    });
    it('Should update properties on the database for a specific instance of Edge Model', (done) => {
      g.queryRaw("g.addV('person').property('name','Peter').property('age', 22)", () => {
        g.queryRaw("g.V().has('name','Victoria').addE('knows').property('duration', 2).to(g.V().has('name','Peter'))", () => {
          Knows.find({duration: 1}, (err, result) => {
            result.update({duration: 5}, (err, result) => {
              expect(result.length).to.equal(1);
              expect(result[0].duration).to.equal(5); 
              Knows.findAll({duration: 5}, (err, result) => {
                expect(result.length).to.equal(1);
                done();
              });
            });
          });
        });
      });
    });
    it('Should not update edge if string type prop is wrong', (done) => {
      Knows.findAll({duration: 1}).update({how: 7}, (err, result) => {
        expect(err).to.not.equal(null);
        done();
      });
    });
    it('Should not update edge if number type prop is wrong', (done) => {
      Knows.findAll({duration: 1}).update({duration: true}, (err, result) => {
        expect(err).to.not.equal(null);
        done();
      });
    });
    it('Should not update edge if date type prop is wrong', (done) => {
      Knows.findAll({duration: 1}).update({anniversary: 'date'}, (err, result) => {
        expect(err).to.not.equal(null);
        done();
      });
    });
    it('Should not update edge if boolean type prop is wrong', (done) => {
      Knows.findAll({duration: 1}).update({friends: "false"}, (err, result) => {
        expect(err).to.not.equal(null);
        done();
      });
    });
    it('Should not update edge if prop is not in schema', (done) => {
      Knows.findAll({duration: 1}).update({employer: false}, (err, result) => {
        expect(err).to.not.equal(null);
        done();
      });
    });
  });

  describe('Delete', () => {
    it('Should be available on Vertex and Edge Models', () => {
      expect(Person.delete).to.be.a('function');
      expect(Knows.delete).to.be.a('function');
    });
    it('Should delete vertices from the database for Vertex Model', (done) => {
      Person.findAll({}).delete((err, result) => {
        Person.findAll({}, (err, result) => {
          expect(result.length).to.equal(0);
          done();
        });  
      });
    });
    it('Should delete vertices on the database for a specific instance of Vertex Model', (done) => {
      Person.create({'name': 'John', 'age': 20, 'dob': '12/18/1999', developer: true}, (err, result) => {
        expect(result.name).to.equal('John');
        result.delete((err, result) => {
          Person.find({name: 'John'}, (err, result) => {
            expect(result.length).to.equal(0);
            Person.findAll({}, (err, result) => {
              expect(result.length).to.equal(2);
              done();
            });
          });
        });     
      });
    });
    it('Should delete edges from the database for Edge Model', (done) => {
      g.queryRaw("g.addV('person').property('name','Peter').property('age', 22)", () => {
        g.queryRaw("g.V().has('name','Victoria').addE('knows').property('duration', 2).to(g.V().has('name','Peter'))", () => {
          Knows.findAll({}).delete((err, result) => {
            expect(result.length).to.equal(0);  
            done();
          });      
        });      
      });
    });
    it('Should delete edges on the database for a specific instance of Edge Model', (done) => {
      g.queryRaw("g.addV('person').property('name','Peter').property('age', 22)", () => {
        g.queryRaw("g.V().has('name','Victoria').addE('knows').property('duration', 2).to(g.V().has('name','Peter'))", () => {
          Knows.find({duration: 1}, (err, result) => {
            result.delete((err, result) => {
              Knows.findAll({}, (err, result) => {
                expect(result.length).to.equal(1);
                done();
              });
            });
          });
        });
      });
    });
  });
});
