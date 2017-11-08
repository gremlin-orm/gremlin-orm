# gremlin-orm

gremlin-orm is an ORM for graph databases in Node.js.  Currently working on Neo4j and Microsoft
Asure Cosmos DB with more to come in the future.

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

Initialize the gremlin-orm instance with parameters matching the gremlin-javascript `createClient()` initialization - with the addition of the dialect argument.

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
* [limit](#limit) - limit the number of results returned

#### Vertex Methods
* [create](#create) - create a new vertex
* [find](#find) - find all vertexes or vertexes matching properties
* [createE](#createE) - define a new edge relationship to another vertex(es)
* [findE](#findE) - find all vertexes connected to initial vertex(es) through a type of edge with optional properties
* [findImplicit](#findImplicit) - find all vertexes which have the same edge relations `in` that the current vertex(es) has `out` to another vertex

#### Edge Methods
* [create](#edge-model-create) - create a new edge relationship by passing in two vertexes or sets of vertexes


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

## Methods

<a id="query" />
#### query(queryString, [raw, callback])

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


<a id="update" />
#### update({props}, callback)

`.update` takes a properties object and updates the relevant properties on the model instance it is called on.

##### Arguments
* `props`: object containing key value pairs of properties to update
* `callback`: Some callback function with (err, result) arguments.

##### Example
```javascript
  Person.find({'name', 'John'}).update({'age', 30}, (err, result) => {
    // send data to client
  });
```

<a id="delete" />
#### delete([callback])

`.delete` removes the object(s) it is called on from the database.

##### Arguments
* `callback`: Some callback function with (err, result) arguments.

##### Example
```javascript
  Person.find({'name', 'John'}, (err, result) => {
    if (result) result.delete();
  });
```


<a id="limit" />
#### limit(num, [callback])

`.limit` limits the query to only the first `num` objects

##### Arguments
* `callback`: Some callback function with (err, result) arguments.

##### Example
```javascript
  Person.find({'name', 'John'}).findE('knows').limit(100, (err, result) => {
    // Return first 100 results of people John knows
  });
```
