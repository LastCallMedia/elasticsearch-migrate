Elasticsearch Migrate
=====================

This is a schema migration framework for Elasticsearch (7+).

To use it:
1. `npm install @lastcall/elasticsearch-migrate`
2. Configure it. 

Configuration:
--------------
To configure migrations, create a new entry in your project's `package.json` with the key `elasticsearch-migrate`.  Example:

```json
{
...
  "elasticsearch-migrate": {
    "root": ".",
    "migrations": ["./dist/migrations/*.js"],
    "elasticsearch": "http://localhost:9200",
    "index": "migrations"
  }
}
```
Each configuration option is optional, with a good default provided. Options are described below:

* **`root`**: The root directory to use when resolving the migrations pattern (defaults to the current working directory).
* **`migrations`**: Glob patterns pointing to migration files, which must be in `.js` format. Defaults to `./migrations/*.js`.
* **`elasticsearch`**: Configuration options for the Elasticsearch client.  May be a string URI, a relative path pointing to a javascript file that exports a fully configured `@elastic/elasticsearch` Client object, or an object specifying the Elasticsearch configuration.
* **`index`**: The Elasticsearch index to use for tracking migration status. Defaults to `migrations`. 
