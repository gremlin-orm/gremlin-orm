# gremlin-orm

[![Build Status](https://travis-ci.org/gremlin-orm/gremlin-orm.svg?branch=master)](https://travis-ci.org/gremlin-orm/gremlin-orm)
[![Coverage Status](https://coveralls.io/repos/github/gremlin-orm/gremlin-orm/badge.svg?branch=master&update)](https://coveralls.io/github/gremlin-orm/gremlin-orm?branch=master)

gremlin-orm is an ORM for graph databases in Node.js.  Currently working on Neo4j and Microsoft
Azure Cosmos DB with more to come in the future.

## Installation

```bash
$ npm install --save gremlin-orm
```

## Example

```javascript
const gremlinOrm = require('gremlin-orm');
const g = new gremlinOrm('neo4j'); // connects to localhost:8182 by default

// Can pass more configuation
// const g = new gremlinOrm(['azure', 'partition-name'], process.env.GPORT, process.env.GHOST, {ssl: true, user: process.env.GUSER, password: process.env.GPASS});

const Person = g.define('person', {
  name: {
    type: g.STRING,
    required: true
  },
  age: {
    type: g.NUMBER
  }
});

Person.create(req.body, (error, result) => {
  if (error) {
    res.send(error);
  }
  else {
    res.send(result);
    // result formatted as nice JSON Object
    /*
      {
        "id": "1",
        "label": "person",
        "name": "Bob",
        "age": 20
      }
    */
  }
});
```

## Documentation

### Initialization

Initialize the gremlin-orm instance with parameters matching the [gremlin-javascript](https://github.com/jbmusso/gremlin-javascript/blob/master/gremlin-client/README.md) `createClient()` initialization - with the addition of the dialect argument.

#### Arguments
* `dialect` (string or Array): Required argument that takes string (`'neo4j'`) or array (`['azure', '<partitionName>']`).
* `port`: Defaults to '8182'
* `host`: Defaults to localhost
* `options`: Options object which takes the same parameters as gremlin-javascript's `createClient()`
  * `session`: whether to use sessions or not (default: `false`)
  * `language`: the script engine to use on the server, see your gremlin-server.yaml file (default: `"gremlin-groovy"`)
  * `op` (advanced usage): The name of the "operation" to execute based on the available OpProcessor (default: `"eval"`)
  * `processor` (advanced usage): The name of the OpProcessor to utilize (default: `""`)
  * `accept` (advanced usage): mime type of returned responses, depending on the serializer (default: `"application/json"`)
  * `path`: a custom URL connection path if connecting to a Gremlin server behind a WebSocket proxy
  * `ssl`: whether to use secure WebSockets or not (default: `false`)
  * `rejectUnauthorized`: when using ssl, whether to reject self-signed certificates or not (default: `true`). Useful in development mode when using gremlin-server self signed certificates. Do NOT use self-signed certificates with this option in production.
  * `user` : username to use for SASL authentication
  * `password` : password to use for SASL authentication

#### Example
```javascript
const gremlinOrm = require('gremlin-orm');
const g = new gremlinOrm(['azure', 'partitionName'], '443', 'example.com', {ssl: true, user: 'sample-user', password: 'sample-password'});
```

### Methods

#### Defining Models
* [define](#define) - alias for defineVertex
* [defineVertex](#defineVertex) - define a new Vertex model
* [defineEdge](#defineEdge) - define a new Edge model

#### Generic Methods
* [query](#query) - run a Gremlin query string on a Model
* [queryRaw](#queryRaw) - perform a raw query on the gremlin-orm root and return raw data
* [update](#update) - update specific props on an existing vertex or edge
* [delete](#delete) - delete an existing vertex or edge
* [order](#order) - order the results by property and asc/desc
* [limit](#limit) - limit the number of results returned

#### Vertex Methods
* [create](#create) - create a new vertex
* [find](#find) - find first vertex with matching properties
* [findAll](#findAll) - find all vertices with matching properties
* [createEdge](#createEdge) - define a new edge relationship to another vertex(es)
* [findEdge](#findEdge) - find edges directly connected to the relevant vertex(es)
* [findRelated](#findRelated) - find all vertices connected to initial vertex(es) through a type of edge with optional properties
* [findImplicit](#findImplicit) - find all vertices which have the same edge relations `in` that the current vertex(es) has `out` to another vertex

#### Edge Methods
* [create](#edge-model-create) - create new edge relationship(s) by passing in two vertices or sets of vertices
* [find](#edge-model-find) - find first edge with matching properties
* [findAll](#edge-model-findAll) - find all edges with matching properties
* [findVertex](#findVertex) - find all vertices that are connected by the relevant edges


## Method Chaining

In order to avoid sacrificing the power of Gremlin traversals, method calls in this ORM can take
advantage of method chaining.  Any read-only method will avoid running its database
query and instead pass its Gremlin query string to the next method in the chain if it is not given a callback.  _Note: All create, update, and delete methods require a callback and can not have more methods chained after._

#### Example

```javascript
  // Only makes one call to the database
  Person.find({'name': 'John'}).findRelated('knows', {'since': '2015'}, (error, result) => {
    // Send people John knows to client
  })
```

Additionally, results returned in the form of JSON objects will retain their relevant model methods for additional queries.

```javascript
  // Makes two calls to the database
  Person.find({'name': 'John'}), (error, result) => {
    let john = result;
    john.findRelated('knows', {'since': '2015'}, (error, result) => {
      // Send people John knows to client
    })
  })
```

## Defining Models

_This ORM utilizes Model definitions similar to [Sequelize](https://github.com/sequelize/sequelize) to add structure to developing servers around graph databases.  Queries outside of the constraints of pre-defined models can be run using the generic [`.query`](#query) or [`.queryRaw`](#queryRaw)._

<a name="define"></a>
### define(label, schema)

`.define` is an alias for defineVertex

<a name="defineVertex"></a>
### defineVertex(label, schema)

`.defineVertex` defines a new instance of the `VertexModel` class - see generic and vertex model methods

##### Arguments
* `label`: Label to be used on all vertices of this model
* `schema`: A schema object which defines allowed property keys and allowed values/types for each key

##### Example
```javascript
const Person = g.define('person', {
  name: {
    type: g.STRING,
    required: true
  },
  age: {
    type: g.NUMBER
  }
});

```

<a name="defineEdge"></a>
### defineEdge(label, schema)

`.defineEdge` defines a new instance of the `EdgeModel` class - see generic and edge model methods

##### Arguments
* `label`: Label to be used on all edges of this model
* `schema`: A schema object which defines allowed property keys and allowed values/types for each key

##### Example
```javascript
const Knows = g.defineEdge('knows', {
  from: {
    type: g.STRING
  },
  since: {
    type: g.DATE
  }
});
```

#### Model Data types

The following options are available when defining model schemas:
* `type`: Use Sequelize-like constants to define data types. Date properties will be returned as javascript Date objects unless returning raw data.  The following data type constants are currently available with possibly more in the future.
  * `g.STRING`
  * `g.NUMBER`
  * `g.DATE`
  * `g.BOOLEAN`
* `required` (default = false): If true, will not allow saving to database if not present or empty

## Generic Methods
<a name="query"></a>
### query(queryString, [raw, callback])

`.query` takes a raw Gremlin query string and runs it on the object it is called on.

##### Arguments
* `queryString`: Gremlin query as a string
* `raw` (optional, default = false): If true, will return the raw data from the graph database instead of normally formatted JSON
* `callback` (optional, required if raw is true): Some callback function with (error, result) arguments.

##### Returns
* If callback is given, returns **array** where 0th index is array of Vertex results and 1th index is array of Edge results (even if either is empty) -- this helps expose the correct model methods if the query returns edges from a query on a vertex or vis versa.

##### Example
```javascript
  let query =  ".as('a').out('created').as('b').in('created').as('c').dedup('a','b').select('a','b','c')"
  Person.find({'name': 'John'}).query(query, true, (error, result) => {
    // send raw data to client
  });
```

<a name="queryRaw"></a>
### queryRaw(queryString, callback)

`.queryRaw` performs a raw query on the gremlin-orm root and returns raw data

##### Arguments
* `queryString`: Gremlin query as a string
* `callback`: Some callback function with (error, result) arguments

##### Example
```javascript
  // query must be a full Gremlin query string
  let query = "g.V(1).as('a').out('created').as('b').in('created').as('c').dedup('a','b').select('a','b','c')"
  g.queryRaw(query, (error, result) => {
    // send raw data to client
  });
```

<a name="update"></a>
### update({props}, callback)

`.update` takes a properties object and updates the relevant properties on the model instance it is called on.

##### Arguments
* `props`: Object containing key value pairs of properties to update
* `callback`: Some callback function with (error, result) arguments

##### Example
```javascript
  Person.find({'name': 'John'}).update({'age', 30}, (error, result) => {
    // send data to client
  });
```

<a name="delete"></a>
### delete(callback)

`.delete` removes the object(s) it is called on from the database.

##### Arguments
* `callback`: Some callback function with (error, result) arguments

##### Example
```javascript
  Person.find({'name', 'John'}, (error, result) => {
    if (result) result.delete((error, result) => {
      // check if successful delete
    });
  });
```

<a name="order"></a>
### order(property, order, [callback])

`.order` sorts the results by a property in ascending or descending order

##### Arguments
* `property`: Name of property to order by
* `order`: Order to sort - 'ASC' or 'DESC'
* `callback` (optional): Some callback function with (error, result) arguments

##### Example
```javascript
  Person.findAll({'occupation': 'developer'}).order('age', 'DESC', (error, result) => {
    // Return oldest developers first
  });
```

<a name="limit"></a>
### limit(num, [callback])

`.limit` limits the query to only the first `num` objects

##### Arguments
* `num`: Max number of results to return
* `callback` (optional): Some callback function with (error, result) arguments

##### Example
```javascript
  Person.find({'name': 'John'}).findEdge('knows').limit(100, (error, result) => {
    // Return first 100 people that John knows
  });
```

## Vertex Methods

<a name="create"></a>
### create({props}, callback)

`.create` creates a new vertex with properties matching props object

##### Arguments
* `props`: Object containing key value pairs of properties matching defined Model schema
* `callback`: Some callback function with (error, result) arguments

##### Returns
* Returns the newly created vertex object (with a unique ID) or an error object of failed schema checks

##### Example
```javascript
  Person.create({'name': 'John', 'age': 30}, (error, result) => {
    // Returns the newly created vertex
    /*
      {
        "id": "1",
        "label": "person",
        "name": "John",
        "age": 30
      }
    */
  });
```

<a name="find"></a>
### find({props}, [callback])

`.find` finds the first vertex with properties matching props object

##### Arguments
* `props`: Object containing key value pairs of properties
* `callback` (optional): Some callback function with (error, result) arguments

##### Returns
* Returns the first matching vertex as an object

##### Example
```javascript
  Person.find({'name': 'John'}, (error, result) => {
    // Returns first vertex found matching props
    /*
      {
        "id": "1",
        "label": "person",
        "name": "John",
        "age": 30
      }
    */
  });
```

<a name="findAll"></a>
### findAll({props}, [callback])

`.findAll` finds the all vertices with properties matching props object

##### Arguments
* `props`: Object containing key value pairs of properties
* `callback` (optional): Some callback function with (error, result) arguments

##### Returns
* Returns an array containing all vertices matching props as objects

##### Example
```javascript
  Person.findAll({'age': 30}, (error, result) => {
    // Returns array of matching vertices
    /*
      [
        {
          "id": "1",
          "label": "person",
          "name": "John",
          "age": 30
        },
        {
          "id": "2",
          "label": "person",
          "name": "Jane",
          "age": 30
        }
      ]
    */
  });
```

<a name="createEdge"></a>
### createEdge(edge, {props}, vertex, [both,] callback)

`.createEdge` creates new edge relationships from starting vertex(es) to vertex(es) passed in.

##### Arguments
* `edge`: Edge model. If a string label is passed, no schema check will be done - edge model is recommended
* `props`: Object containing key value pairs of properties to place on new edges
* `vertex`: Vertex model instances or vertex model query
* `both` (optional, default = false): If true, will create edges in both directions
* `callback`: Some callback function with (error, result) arguments

##### Returns
* Returns an array containing all new created edges

##### Examples
```javascript
  // Chaining vertex methods
  Person.findAll({'age': 20}).createEdge(Uses, {'frequency': 'daily'}, Website.find({'name': 'Facebook'}), (error, result) => {
    // Result is array of newly created edges from everyone with age 20 to the website 'Facebook'
  });

  // Calling .createEdge on model instances
  Person.findAll({'occupation': 'web developer'}, (error, results) => {
    let developers = results;
    Language.findAll({'name': ['Javascript', 'HTML', 'CSS']}, (error, results) => {
      let languages = results;
      developers.createEdge(Uses, {}, languages, (error, result) => {
        // Result is array of newly created edge objects from each web developers
        // to each of the 3 important components of web development
      });
    });
  });


  // Creating edges both ways
  Person.find({'name': 'Jane'}, (error, result) => {
    let jane = result;
    Person.find({'name' : 'John'}).createEdge(Knows, {since: '1999'}, jane, true, (error, result) => {
      // Creates two edges so that John knows Jane and Jane also knows John
    })
  });
```

<a name="findEdge"></a>
### findEdge(edge, {props}, [callback])

`.findEdge` finds edges directly connected to the relevant vertex(es)

##### Arguments
* `edge`: Edge model. If a string label is passed, no schema check will be done - edge model is recommended
* `props`: Object containing key value pairs of properties to match on edge relationships
* `callback` (optional): Some callback function with (error, result) arguments

##### Returns
* Returns an array containing all connected edges

##### Examples
```javascript
Person.find({'name': 'John'}).findEdge(Knows, {'from': 'school'}, (error, result) => {
  // Result is array of edge objects representing all the 'knows' relationships of John
  // where John knows the person from school (edge model property)
});
```

<a name="findRelated"></a>
### findRelated(edge, {props}, depth, [inModel, callback])

`.findRelated` finds vertices related through the desired edge relationship.

##### Arguments
* `edge`: Edge model. If a string label is passed, no schema check will be done - edge model is recommended.
* `props`: Object containing key value pairs of properties to match on edge relationships
* `depth`: Depth of edge traversals to make
* `inModel` (optional, default = `this`): Vertex model of results to find. Can pass a vertex model (`Person`) or label string (`'person'`) -- vertex model is recommended.
* `callback` (optional): Some callback function with (error, result) arguments

##### Returns
* Returns an array containing all related vertices

##### Examples
```javascript
Person.find({'name': 'John'}).findRelated(Knows, {}, 2, (error, result) => {
  // Result is array of Person records representing John's friends of friends
});

Person.find({'name': 'John'}).findRelated(Likes, {}, 1, Movie, (error, result) => {
  // Result is array of Movie records that John likes.
});
```

<a name="findImplicit"></a>
### findImplicit(edge, {props}, [callback])

`.findImplicit` finds vertices that are related to another vertex the same way the original vertex is.

##### Arguments
* `edge`: Edge model. If a string label is passed, no schema check will be done - edge model is recommended.
* `props`: Object containing key value pairs of properties to match on edge relationships
* `callback` (optional): Some callback function with (error, result) arguments

##### Returns
* Returns an array containing all related vertices

##### Examples
```javascript
Person.find({'name': 'John'}).findImplicit('created', {}, (error, result) => {
  // Result is array of vertex objects representing people who have co-created things that John created
});
```


## Edge Methods

<a name="edge-model-create"></a>
### create(out, in, {props}, callback)

`.create` creates an index from `out` vertex(es) to the `in` vertex(es)

##### Arguments
* `out`: Vertex instance(s) or find/findAll method call
* `in`: Vertex instance(s) or find/findAll method call
* `props`: Object containing key value pairs of properties to add on the new edge
* `both` (optional, default = false): If true, will create edges in both directions
* `callback`: Some callback function with (error, result) arguments

##### Returns
* Returns newly created edge object

##### Examples
```javascript
Person.find({'name': 'Joe'}, (error, result) => {
  let joe = result;
  Knows.create(Person.find({'name': 'John'}), joe, {'since': 2015}, (error, result) => {
    // Returns the newly created edge
    /*
      {
        "id": "1",
        "label": "knows",
        "since": "2015",
        "outV": "1",  // John's id
        "inV": "2",   // Joe's id
      }
    */
  });
});
```

<a name="edge-model-find"></a>
### find({props}, [callback])

`.find` finds the first edge with properties matching props object

##### Arguments
* `props`: Object containing key value pairs of properties
* `callback` (optional): Some callback function with (error, result) arguments

##### Returns
* Returns the first matching edge as an object

##### Example
```javascript
  Knows.find({'since': 2015}, (error, result) => {
    // Returns first edge found matching props
    /*
      {
        "id": "1",
        "label": "knows",
        "since": 2015,
        "outV": 1,
        "inV": 123
      }
    */
  });
```

<a name="findAll"></a>
### findAll({props}, [callback])

`.findAll` finds the all edges with properties matching props object

##### Arguments
* `props`: Object containing key value pairs of properties
* `callback` (optional): Some callback function with (error, result) arguments

##### Returns
* Returns an array containing all edges matching props as objects

##### Example
```javascript
  Knows.findAll({'since': 2015}, (error, result) => {
    // Returns array of matching edges
    /*
      [
        {
          "id": "1",
          "label": "knows",
          "since": 2015,
          "outV": 1,
          "inV": 123
        },
        {
          "id": "2",
          "label": "knows",
          "since": 2015,
          "outV": 1,
          "inV": 200
        }
      ]
    */
  });
```

<a name="findVertex"></a>
### findVertex(vertexModel, {props}, [callback])

`.findVertex` finds the all vertices with properties matching props object connected by the relevant edge(s)

##### Arguments
* `vertexModel`: Vertex model. If a string label is passed, no schema check will be done - vertex model is recommended.
* `props`: Object containing key value pairs of properties to find on vertices
* `callback` (optional): Some callback function with (error, result) arguments

##### Returns
* Returns an array containing all vertices connected by current edge(s)

##### Example
```javascript
Knows.find({'through': 'school'}).findVertex(Person, {'occupation': 'developer'}, (error, result) => {
  // Result is array of people who are developers who know other people through school
});
```

## Contributing

Please submit issues/pull requests if you have feedback or message the gremlin-orm team to be added as a contributor: gremlin.orm@gmail.com

## Authors

Freeman Chen (https://github.com/freemanchen)

Gordon Farquharson (https://github.com/godronus)

Jeremy Lee (https://github.com/jeremyslee)

## License

This project is licensed under the MIT License

## Resources
[Apache TinkerPop Gremlin Reference](http://tinkerpop.apache.org/docs/3.3.0/reference/)
