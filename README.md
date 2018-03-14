# Kiddy
## MySQL + Connection Pool + Promises
## Quick Start
To install `kiddy` in your project run the following in your project root:

	npm install  kiddy

With the necessary configuration below, using Kiddy and MySQL promise wrapped queries is as simple as:

	handle = null;
	kiddy.touch()
	.then(function (conn) {
		console.log("Connection acquired");
		/*\
		|*| Save connection handle to release later
		\*/
		handle = conn;
		/*\
		|*| Database logic here, feel free to use the promise wrapped method
		|*| handle.pq to preform a mysql conn.query.
		\*/
		return handle.query('SELECT 1');
	})
	.then(function (rows) {
		/*\
		|*| Query results
		\*/
		console.log(rows);
		/*\
		|*| When done, release the connection as shown below
		\*/
		return kiddy.release(handle);
	})
	.then(function (msg) {
		handle = null;
		console.log(msg);
		// Connection released
	})
	.fail(function (err) {
		/*\
		|*| Any MySQL Errors will propagate to this rejection handler.
		\*/
		console.log(err);
		// Error message
		/*\
		|*| Release the handle if it is non-null
		\*/
		if (handle) {
			kiddy.release(handle);
		}
	});

This keeps your application's database logic simple and handles all of the errors that should occur.

## Configuration
You have two options when using Kiddy.

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

	With this config file and the info above, Kiddy should __Just Work ™__.

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
