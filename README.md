# Kiddy
## MySQL + Connection Pool + Promises
## Quick Start
To install `kiddy` in your project run the following in your project root:

	npm install  kiddy

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

This snippet will create a connection pool using your config defined connection parameters and get you a connection from the pool for immediate use. Error handling and

## Normal Usage

To properly handle errors and release your connection when you are done, you code should look more like this:

	handle = null;
	kiddy.touch()
	.then(function (conn) {
		/*\
		|*| Save connection handle to release later
		\*/
		handle = conn;
		/*\
		|*| Database logic here, feel free to use the promise wrapped method
		|*| handle.pq to preform a mysql conn.query.
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

### setOptions
promise __kiddy.setOptions(options)__
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

### touch
promise __kiddy.touch()__
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

### release
promise __kiddy.release(handle)__
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
`kiddy.relase` does not accept any arguments or options.
