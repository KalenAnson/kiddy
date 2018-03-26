/*\
|*| Kiddy MySQL Connection Pool Handler
|*| Requires
\*/
var Q = require('q');
var config = require('config');
var mysql = require('mysql');
var exports = module.exports;
var configCache = undefined;
var pool = undefined;
/*\
|*| Manually set the configuration options.
|*| Wrapped in a promise to make this thenable.
\*/
exports.setConfig = function (options) {
	return Q.Promise(function (resolve, reject, notify) {
		/*\
		|*| Check for manditory stuff
		\*/
		if (typeof options === 'undefined') {
			return reject('Kiddy: missing options');
		}
		if (typeof options.user === 'undefined') {
			return reject('Kiddy: invalid options, the user option is mandatory');
		}
		var creds = {
			host: options.host || "localhost",
			port: options.port || 3306,
			user: options.user,
			password: options.password || "",
			database: options.database || ""
		};
		configCache = creds;
		return resolve('Options set successfully');
	});
};
/*\
|*| Get a connection handle from a mysql connection pool. If the pool does not
|*| exist, it will attempt to create the pool.
\*/
exports.touch = function () {
	return Q.Promise(function (resolve, reject, notify) {
		_checkConfig()
		.then(function (creds) {
			return _touchPool(creds);
		})
		.then(function (conn) {
			return resolve(conn);
		})
		.fail(function (err) {
			return reject(err);
		});
	});
};
/*\
|*| Release a connection handle back to the pool for reuse.
\*/
exports.release = function (conn) {
	return Q.Promise(function (resolve, reject, notify) {
		conn.release();
		return resolve('Connection released');
	});
};
/*\
|*| Get the current mysql connection information. Wrapped in a promise to keep
|*| the `thenable` program flow used in other database function calls.
\*/
_checkConfig = function () {
	return Q.Promise(function (resolve, reject, notify) {
		/*\
		|*| Resolve the cache or load the config from disk
		\*/
		if (typeof configCache === 'undefined') {
			/*\
			|*| Test for valid configuration
			\*/
			var key = "";
			if (config.has('rdb') ) {
				key = config.rdb;
			} else if (config.has('database') ) {
				key = config.database;
			} else if (config.has('mysql') ) {
				key = config.mysql;
			} else {
				return reject('Kiddy: unable to locate databse configuration in config file');
			}
			if (typeof config.rdb === 'undefined') {
				return reject('Kiddy: missing database configuration');
			} else {
				var creds = {
					host: config.rdb.host || "localhost",
					port: config.rdb.port || 3306,
					user: config.rdb.user,
					password: config.rdb.password,
					database: config.rdb.database || ""
				};
				configCache = creds;
				return resolve(configCache);
			}
		} else {
			return resolve(configCache);
		}
	});
};
/*\
|*| Create or verify the database pool and retrieve a connection handle.
\*/
_touchPool = function (info) {
	return Q.Promise(function (resolve, reject, notify) {
		if (typeof kiddy === 'undefined') {
			pool = mysql.createPool({
				host: info.host,
				port: info.port,
				user: info.user,
				password: info.password,
				database: info.database
			});
		};
		if (typeof pool.getConnection === 'function') {
			Q.ninvoke(pool, 'getConnection')
			.then(function (conn) {
				return _wrapConnection(conn);
			})
			.then(function (conn) {
				return resolve(conn);
			})
			.fail(function (err) {
				pool = undefined;
				return reject(err);
			});
		} else {
			pool = undefined;
			return reject('Kiddy: connection pool was drained or is invalid');
		}
	});
};
/*\
|*| Return the vanilla mysql connection wrapped with the additional method:
|*| conn.pq - promise wrapped call to conn.query
\*/
_wrapConnection = function (conn) {
	return Q.Promise(function (resolve, reject, notify) {
		if (typeof conn.query === 'function') {
			conn.pq = function (options, values) {
				return Q.ninvoke(this, 'query', options, values);
			}
			return resolve(conn);
		} else {
			return reject('Kiddy: invalid msyql connection passed to _wrapConnection');
		}
	});
}
