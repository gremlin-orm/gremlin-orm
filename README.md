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
