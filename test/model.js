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
        g.queryRaw("g.addV('person').property('name','Samantha').property('age', 47)", () => {
          let knowsProps = ".property('duration', 1).property('how', 'golf days')";
          knowsProps += ".property('anniversary', 1458101167000).property('duration', 1)";
          g.queryRaw(`g.V().has('name','Victoria').addE('knows')${knowsProps}.to(g.V().has('name','Samantha'))`, () => {
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

  describe('Order', () => {
    beforeEach(done => {
      g.queryRaw("g.addV('person').property('name','Bobby').property('age', 22)", () => {
        g.queryRaw("g.addV('person').property('name','Bobby').property('age', 33)", () => {
          g.queryRaw("g.addV('person').property('name','Harry').property('age', 28)", () => {
            let knowsProps = ".property('how', 'cooking class')";
            knowsProps += ".property('anniversary', 1458901167000).property('duration', 1)";
            let bobby33 = "g.V().has('name','Bobby').has('age', 33)"
            g.queryRaw(`${bobby33}.addE('knows')${knowsProps}.to(g.V().has('name','Harry'))`, () => {
              done();
            });
          });
        });
      });
    });
    it('Should be available on Vertex and Edge Models', () => {
      expect(Person.order).to.be.a('function');
      expect(Knows.order).to.be.a('function');
    });
    it('Should expect at least 1 prop to order by', (done) => {
      Person.findAll({}).order('', 'ASC', (err, result) => {
        expect(result).to.equal(undefined);
        done()
      });
    });
    it('Should expect option to be ASC or DESC', (done) => {
      Person.findAll({}).order('name', 'INCR', (err, result) => {
        expect(result).to.equal(undefined);
        done();
      });
    });
    it('Should order vertices in ascending order', (done) => {
      Person.findAll({}).order('name', 'ASC', (err, result) => {
        expect(result[0].name).to.equal('Bobby');
        expect(result[1].name).to.equal('Bobby');
        expect(result[2].name).to.equal('Harry');
        expect(result[3].name).to.equal('Samantha');
        expect(result[4].name).to.equal('Victoria');
        done()
      });
    });
    it('Should order vertices in descending order', (done) => {
      Person.findAll({}).order('name', 'DESC', (err, result) => {
        expect(result[0].name).to.equal('Victoria');
        expect(result[1].name).to.equal('Samantha');
        expect(result[2].name).to.equal('Harry');
        expect(result[3].name).to.equal('Bobby');
        expect(result[4].name).to.equal('Bobby');
        done()
      });
    });
    it('Should be able to chain order() methods for different props on vertices', (done) => {
      Person.findAll({}).order('name', 'ASC').order('age', 'ASC', (err, result) => {
        expect(result[0].name).to.equal('Bobby');
        expect(result[1].name).to.equal('Bobby');
        expect(result[0].age).to.equal(22);
        expect(result[1].age).to.equal(33);
        Person.findAll({}).order('name', 'ASC').order('age', 'DESC', (err, result) => {
          expect(result[0].name).to.equal('Bobby');
          expect(result[1].name).to.equal('Bobby');
          expect(result[0].age).to.equal(33);
          expect(result[1].age).to.equal(22);
          done();
        });
      });
    });
    it('Should order edges in ascending order', (done) => {
      Knows.findAll({}).order('anniversary', 'ASC', (err, result) => {
        expect(result[0].anniversary.getTime()).to.equal(1458101167000);
        done();
      });
    });
    it('Should order edges in decscending order', (done) => {
      Knows.findAll({}).order('anniversary', 'DESC', (err, result) => {
        expect(result[0].anniversary.getTime()).to.equal(1458901167000);
        done();
      });
    });
    it('Should be able to chain order() methods for different props on edges', (done) => {
      Knows.findAll({}).order('duration', 'ASC').order('how', 'ASC', (err, result) => {
        expect(result[0].duration).to.equal(1);
        expect(result[0].how).to.equal('cooking class');
        Knows.findAll({}).order('duration', 'ASC').order('how', 'DESC', (err, result) => {
          expect(result[0].duration).to.equal(1);
          expect(result[0].how).to.equal('golf days');
          done();
        });
      });
    });
  });

  describe('Limit', () => {
     beforeEach(done => {
      g.queryRaw("g.addV('person').property('name','Bobby').property('age', 22)", () => {
        g.queryRaw("g.addV('person').property('name','Bobby').property('age', 33)", () => {
          g.queryRaw("g.addV('person').property('name','Harry').property('age', 28)", () => {
            let knowsProps = ".property('duration', 1).property('how', 'cooking class')";
            knowsProps += ".property('anniversary', 1458901167000)";
            let bobby = "g.V().has('name','Bobby')"
            g.queryRaw(`${bobby}.addE('knows')${knowsProps}.to(g.V().has('name','Harry'))`, () => {
              done();
            });
          });
        });
      });
    });
    it('Should be available on Vertex and Edge Models', () => {
      expect(Person.limit).to.be.a('function');
      expect(Knows.limit).to.be.a('function');
    });
    it('Should limit result set of vertices to num provided', (done) => {
      Person.findAll({}).limit(1, (err, result) => {
        expect(result.length).to.equal(1);
        Person.findAll({}).limit(2, (err, result) => {
          expect(result.length).to.equal(2);
          Person.findAll({}).limit(3, (err, result) => {
            expect(result.length).to.equal(3);
            done();
          });
        });
      });
    });
    it('Should limit result set of edges to num provided', (done) => {
      Knows.findAll({}).limit(1, (err, result) => {
        expect(result.length).to.equal(1);
        Knows.findAll({}).limit(2, (err, result) => {
          expect(result.length).to.equal(2);
          Knows.findAll({}).limit(3, (err, result) => {
            expect(result.length).to.equal(3);
            done();
          });
        });
      });
    });
  });
});
