# gremlin-orm

gremlin-orm is an ORM for graph databases in Node.js.  Currently working on Neo4j and Microsoft
Azure Cosmos DB with more to come in the future.

**_This project is currently under development_**

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
  name: 'string',
  age: 'number'
});

Person.create(req.body, (err, result) => {
  if (err) {
    res.send(err);
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

#### Generic Methods
* [query](#query) - perform a cypher query and parse the results
* [update](#update) - update specific props on an existing vertex or edge
* [delete](#delete) - delete an existing vertex or edge
* [order](#order) - order the results by property and asc/dsc
* [limit](#limit) - limit the number of results returned

#### Vertex Methods
* [create](#create) - create a new vertex
* [find](#find) - find first vertex with matching properties
* [findAll](#findAll) - find all vertexes with matching properties
* [createE](#createE) - define a new edge relationship to another vertex(es)
* [findE](#findE) - find all vertexes connected to initial vertex(es) through a type of edge with optional properties
* [findImplicit](#findImplicit) - find all vertexes which have the same edge relations `in` that the current vertex(es) has `out` to another vertex

#### Edge Methods
* [create](#edge-model-create) - create a new edge relationship by passing in two vertexes or sets of vertexes
* [find](#edge-model-find) - find first edge with matching properties
* [findAll](#edge-model-findAll) - find all edges with matching properties
* [findV](#findV) - find all vertexes that are connected by the current edges


## Method Chaining

In order to avoid sacrificing the power of Gremlin traversals, method calls in this ORM can take
advantage of method chaining.  Any non-creation method will avoid running its database
query and instead pass its Gremlin query string to the next method in the chain if it is not given a callback.

#### Example

```javascript
  Person.find({'name': 'John'}).findE('knows', {'since': '2015'}, (err, result) => {
    // Send people John knows to client
  })
```

## Generic Methods

### query(queryString, [raw, callback]) <a id="query"></a>

`.query` takes a raw Gremlin query string and runs it on the object it is called on.

##### Arguments
* `query`: Gremlin query as a string
* `raw` (optional, default = false): If true, will return the raw data from the graph database instead of normally formatted JSON
* `callback` (optional): Some callback function with (err, result) arguments.

##### Example
```javascript
  let query = "g.V().as('a').out('created').as('b').in('created').as('c').dedup('a','b').select('a','b','c')"
  g.query(query, true, (err, result) => {
    // send raw data to client
  });
```


### update({props}, callback) <a id="update"></a>

`.update` takes a properties object and updates the relevant properties on the model instance it is called on.

##### Arguments
* `props`: object containing key value pairs of properties to update
* `callback`: Some callback function with (err, result) arguments.

##### Example
```javascript
  Person.find({'name': 'John'}).update({'age', 30}, (err, result) => {
    // send data to client
  });
```

### delete([callback]) <a id="delete"></a>

`.delete` removes the object(s) it is called on from the database.

##### Arguments
* `callback`: Some callback function with (err, result) arguments.

##### Example
```javascript
  Person.find({'name', 'John'}, (err, result) => {
    if (result) result.delete();
  });
```

### order(property, order, [callback]) <a id="order"></a>

`.order` sorts the results by a property in ascending or descending order

##### Arguments
* `property`: name of property to order by
* `order`: order to sort - 'ASC' or 'DSC'
* `callback`: Some callback function with (err, result) arguments.

##### Example
```javascript
  Person.findAll({'occupation': 'developer'}).order('age', 'DSC', (err, result) => {
    // Return oldest developers first
  });
```

### limit(num, [callback]) <a id="limit"></a>

`.limit` limits the query to only the first `num` objects

##### Arguments
* `num`: Max number of results to return
* `callback`: Some callback function with (err, result) arguments.

##### Example
```javascript
  Person.find({'name': 'John'}).findE('knows').limit(100, (err, result) => {
    // Return first 100 people that John knows
  });
```

## Vertex Methods


### create({props}, [callback]) <a id="create"></a>

`.create` creates a new vertex with properties matching props object

##### Arguments
* `props`: Object containing key value pairs of properties matching defined Model schema
* `callback`: Some callback function with (err, result) arguments.

##### Returns
* Returns the newly created vertex object (with a unique ID) or an error object of failed schema checks

##### Example
```javascript
  Person.create({'name': 'John', 'age': 30}, (err, result) => {
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

### find({props}, [callback]) <a id="find"></a>

`.find` finds the first vertex with properties matching props object

##### Arguments
* `props`: Object containing key value pairs of properties
* `callback`: Some callback function with (err, result) arguments.

##### Returns
* Returns the first matching vertex as an object

##### Example
```javascript
  Person.find({'name': 'John'}, (err, result) => {
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

### findAll({props}, [callback]) <a id="findAll"></a>

`.findAll` finds the all vertexes with properties matching props object

##### Arguments
* `props`: Object containing key value pairs of properties
* `callback`: Some callback function with (err, result) arguments.

##### Returns
* Returns an array containing all vertices matching props as objects

##### Example
```javascript
  Person.findAll({'age': 30}, (err, result) => {
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

### createE(edge, {props}, vertex, [callback]) <a id="createE"></a>

`.createE` creates new edge relationships from starting vertex(es) to vertex(es) passed in.

##### Arguments
* `edge`: Edge model definition
* `props`: Object containing key value pairs of properties to place on new edges
* `vertex`: Vertex model instances or vertex model query
* `callback`: Some callback function with (err, result) arguments.

##### Returns
* Returns an array containing all new created edges

##### Examples
```javascript
  // Chaining vertex methods
  Person.findAll({'age': 20}).createE(Uses, {'frequency': 'daily'}, Website.find({'name': 'Facebook'}), (err, result) => {
    // Result is array of newly created edges between everyone with age 20 and the website 'Facebook'
  });

  // Calling .createE on model instances
  let developers, languages;
  Person.find({'occupation': 'web developer'}, (err, result) => developers = result);
  Language.find({'occupation': ['Javascript', 'HTML', 'CSS']}, (err, result) => languages = result);
  developers.createE(Knows, {}, languages, (err, result) => {
    // Result is array of newly created edge objects between all the web developers and 3 important components of web development
  });
```

### findE(label, {props}, depth, [callback]) <a id="findE"></a>

`.findE` finds vertexes related through the desired edge relationship.

##### Arguments
* `label`: Edge label string
* `props`: Object containing key value pairs of properties to match on edge relationships
* `depth`: Depth of edge traversals to make
* `callback`: Some callback function with (err, result) arguments.

##### Returns
* Returns an array containing all related vertices

##### Examples
```javascript
Person.find({'name': 'John'}).findE('knows', {}, 2, (err, result) => {
  // Result is array of vertex objects representing John's friends of friends
});
```

### findImplicit(label, {props}, [callback]) <a id="findImplicit"></a>

`.findImplicit` finds vertexes that are related to another vertex the same way the original vertex is.

##### Arguments
* `label`: Edge label string
* `props`: Object containing key value pairs of properties to match on edge relationships
* `callback`: Some callback function with (err, result) arguments.

##### Returns
* Returns an array containing all related vertices

##### Examples
```javascript
Person.find({'name': 'John'}).findImplicit('created', {}, 2, (err, result) => {
  // Result is array of vertex objects representing people who have co-created things that John created
});
```


## Edge Methods

### create(out, in, {props}, [callback]) <a id="edge-model-create"></a>

`.create` creates an index from `out` vertex(es) to the `in` vertex(es)

##### Arguments
* `out` (String or Object): Object with properties to find 'out' vertex, or string representing `id`
* `in` (String or Object): Object with properties to find 'in' vertex, or string representing `id`
* `props`: Object containing key value pairs of properties to add on the new edge
* `callback`: Some callback function with (err, result) arguments.

##### Returns
* Returns newly created edge object

##### Examples
```javascript
Knows.create({'name': 'John'}, '123', {'since': 2015}, (err, result) => {
  // Returns the newly created edge
  /*
    {
      "id": "1",
      "label": "knows",
      "since": "2015",
      "outV": "1",
      "inV": "123",
    }
  */
});
```



### find({props}, [callback]) <a id="edge-model-find"></a>

`.find` finds the first edge with properties matching props object

##### Arguments
* `props`: Object containing key value pairs of properties
* `callback`: Some callback function with (err, result) arguments.

##### Returns
* Returns the first matching edge as an object

##### Example
```javascript
  Knows.find({'since': 2015}, (err, result) => {
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

### findAll({props}, [callback]) <a id="findAll"></a>

`.findAll` finds the all edges with properties matching props object

##### Arguments
* `props`: Object containing key value pairs of properties
* `callback`: Some callback function with (err, result) arguments.

##### Returns
* Returns an array containing all edges matching props as objects

##### Example
```javascript
  Knows.findAll({'since': 2015}, (err, result) => {
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


### findV({props}, [callback]) <a id="findV"></a>

`.findV` finds the all vertexes with properties matching props object connected by the current edge(s)

##### Arguments
* `props`: Object containing key value pairs of properties to find on vertices
* `callback`: Some callback function with (err, result) arguments.

##### Returns
* Returns an array containing all vertices connected by current edge(s)

##### Example
```javascript
Knows.find({'through': 'school'}).findV({'occupation': 'developer'}, (err, result) => {
  // Result is array of people who are developers who know other people through school
});
```
