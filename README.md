# Kiddy
[![NPM](https://nodei.co/npm/kiddy.svg?downloads=true&downloadRank=true)](https://nodei.co/npm/kiddy/)&nbsp;&nbsp;
[![Build Status](https://secure.travis-ci.org/KalenAnson/kiddy.svg?branch=master)](https://travis-ci.org/KalenAnson/kiddy)&nbsp;&nbsp;
## MySQL + Connection Pool + Promises
## Quick Start
To install `kiddy` in your project run the following in your project root:

	npm install kiddy

With the necessary configuration in place (see [Configuration](##Configuration) below), using Kiddy and MySQL promise wrapped queries is as simple as:

	handle = null;
	kiddy.touch()
	.then(function (conn) {
		handle = conn;
		/*\
		|*| Database logic here.
		|*| Feel free to use the method conn.pq to preform a promise wrapped
		|*| mysql conn.query or the vanilla conn.query.
		\*/
		return handle.pq('SELECT 1');
	})
	.fail(function (err) {
		...
	});

This snippet will create a connection pool using your config defined connection parameters and get you a connection from the pool for immediate use.

## Normal Usage

To properly handle errors and release your connection when you are done, you code should probably look more like this:

	handle = null;
	kiddy.touch()
	.then(function (conn) {
		/*\
		|*| Save connection handle to release later
		\*/
		handle = conn;
		/*\
		|*| Database logic here, feel free to use the promise wrapped
		|*| method handle.pq to preform a mysql conn.query.
		\*/
		return handle.pq('SELECT 1');
	})
	.then(function (rows) {
		/*\
		|*| Query results, do stuff
		\*/
		console.log(rows);
		/*\
		|*| When done, release the connection as shown below
		\*/
		return kiddy.release(handle);
	})
	.then(function (msg) {
		handle = null;
		console.log(msg); // Connection released
	})
	.fail(function (err) {
		/*\
		|*| Any MySQL Errors will propagate to this rejection handler.
		\*/
		console.log(err); // An error message
		/*\
		|*| Release the handle if it is non-null
		\*/
		if (handle) {
			kiddy.release(handle);
			handle = null;
		}
	});

This keeps your application's database logic simple and handles all of the errors that should occur. The connection is released after your query is complete, allowing the pool to reuse the connection.

## Configuration
You have two simple options to configure your database connection when using Kiddy.

1. Kiddy can use your (gitignored) config file located at `/config/default.json` or `/config/production.json` (in production environments) using the [`config`](https://www.npmjs.com/package/config) package. See [the `config` manual](https://www.npmjs.com/package/config) for more info.

	Here is the necessary stanza:

		...,
		"rdb": {
			"host": "127.0.0.1",
			"port": 3306,
			"user": "dbUsername",
			"password": "password",
			"database": "database"
		},
		...

	If the `rdb` (for relational database) key is not present, Kiddy will attempt to fall back to one called `database` or `mysql`.

	With this config file and the info above, Kiddy should __Just Work ™__, no need to call any configuration functions at all.

2. You can supply database connection information prior to using Kiddy in your project.

	If you don't have your database creds in a config file, why not include them in your project source code (this is a bad idea), or manually parse them from some other secure location outside of your source tree (good idea).

	Then call the following with your manually specified options:

		kiddy.setOptions({
			"host": "127.0.0.1",
			"port": 3306,
			"user": "dbUsername",
			"password": "password",
			"database": "database"
		})
		.then(function (msg) {
			console.log(msg);
			// Kiddy options set successfully
		})
		.fail(function (err) {
			console.log(err);
			// An error message
		});

## API
The Kiddy api is pretty straightforward.

### promise kiddy.setOptions(options)
Optional method to override the default kiddy options at `/config/default.json`.
#### Return
Returns a promise which is resolved with a success message.

	.then(function (msg) {
		console.log(msg); // Success
	})

#### Error
On error, the promise is rejected with an error message.

	.fail(function (err) {
		console.log(err); // Error message
	})

#### Arguments
Accepts an object with the following properties defined:

	{
		host: "127.0.0.1",
		port: 3306,
		user: "dbUsername",
		password: "password",
		database: "database"
	}

### promise kiddy.touch()
Get a MySQL connection from the connection pool. This method will lazly initialize the pool if it does not exist.
#### Return
Returns a promise which is resolved with a MySQL connection handle. You are advised to save the reference to the connection handle in order to release it when you are done.

	.then(function (conn) {
		/*\
		|*| Save connection handle to release later
		\*/
		handle = conn;
		/*\
		|*| `conn` is an instance of pool.getConnection with added magic
		\*/
		return handle.pq('SELECT 1');
	})

#### Error
On error, the promise is rejected with an error message.

	.fail(function (err) {
		console.log(err); // Error message
	})

#### Arguments
`kiddy.touch` does not accept any arguments or options.

### promise conn.pq(options, values)
Preform a promise wrapped MySQL query using the specified options.
#### Return
Returns a promise which is resolved with a MySQL result set.

	.then(function (result) {
		console.log(result); // The result set
	})

#### Understanding Node-MySQL's Promise-Wrapped Results
Remember, since a promise can only be resolved with a discrete value (primitive, array or object), the `result` above is actually a multi-dimensional array which looks like this:

For `SELECT` statements:

	[								// Outer array
		[							// Inner array 0, array of result rows
			RowDataPacket (object)
		],
		[							// Inner array 1, array of result fields
			FieldPacket (object)
		]
	]

For `INSERT`, `UPDATE` or `DELETE` statements:

	[
		OkPacket (object),
		undefined
	]

Here is the breakdown on each of these low-level MySQL objects.

`RowDataPacket` - An object where each property corresponds to one of the fields in the select statement. For example if you are  running the following query:

	Select `id` FROM `mydb`.`mytable`

An individual `RowDataPacket` object would be:

	{
		id: 2
	}

for the first row of the result set.

`FieldPacket` - Field metadata containing the following properties:

	{
		catalog: 'def',
		db: 'theDatabaseName',
		table: 'theTableNameAlias',
		orgTable: 'theTableName',
		name: 'fieldNameAlias',
		orgName: 'fieldName',
		charsetNr: 63,				// The field's character set
		length: 10,					// Size of the field
		type: 3,					// Type of the field
		flags: 16899,
		decimals: 0,				// Number of decimals
		default: undefined,			// The field's default value
		zeroFill: false,			// Whether this field is zero filled
		protocol41: true
	}

`OkPacket` - MySQL statement results containing the following properties:

	{
		fieldCount: 0,
		affectedRows: 1,			// Number of rows affected by query
		insertId: 0,				// AutoIncrement ID (if an INSERT)
		serverStatus: 2,
		warningCount: 0,
		message: '(Rows matched: 1  Changed: 1  Warnings: 0',
		protocol41: true,
		changedRows: 1				// Rows that were changed by the query
	}

To make use of these promise resolved results, roll like this for a `SELECT` statement:

	.then(function (data) {
		var rows = data[0];
		var fields = data[1];
		console.log(rows.length);	// Your row count
		console.log(rows[0]);		// Your first result
		console.log(fields.length); // The number of fields in the results
		console.log(fields[0]); 	// The first field's metadata
	})

and like this for `INSERT`, `UPDATE` or `DELETE` statements:

	.then(function (data) {
		var results = data[0];		// Your result object
		var fields = data[1];		// Undefined, ignore this
		console.log(results.affectedRows);	// Doing work son.
	})

#### Error
On error, the promise is rejected with an error message.

	.fail(function (err) {
		console.log(err); // Error message
	})

#### Arguments
`conn.pq` accepts the same arguments that the underlying MySQL `conn.query` method accepts. These options can be:

1. An SQL string
2. An SQL string and an array of placeholder values
3. An options object

For more information, see [the documentation for the node-mysql package](https://github.com/mysqljs/mysql#performing-queries).

### promise kiddy.release(handle)
Releases a MySQL connection handle to the connection pool for reuse.
#### Return
Returns a promise which is resolved with a success message if the connection was released successfully.

	.then(function (msg) {
		console.log(msg); // Success
	})

#### Error
On error, the promise is rejected with an error message.

	.fail(function (err) {
		console.log(err); // Error message
	})

#### Arguments
`kiddy.release` accepts one mandatory argument which is the connection to release.
