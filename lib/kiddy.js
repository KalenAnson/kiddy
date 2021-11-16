/*\
|*| Kiddy MySQL Connection Pool Handler
|*| Requires
\*/
import Q from 'q';
import config from 'config';
import mysql from 'mysql';
let configCache = undefined;
let pool = undefined;
/*\
|*| Manually set the configuration options.
|*| Wrapped in a promise to make this thenable.
\*/
export const setConfig = function (options) {
	return Q.Promise(function (resolve, reject, notify) {
		/*\
		|*| Check for manditory stuff
		\*/
		if (typeof options === 'undefined') {
			return reject(new Error('Kiddy: missing options') );
		}
		if (typeof options.user === 'undefined') {
			return reject(new Error('Kiddy: invalid options, the user option is mandatory') );
		}
		let creds = {
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
export const touch = function () {
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
export const release = function (conn) {
	return Q.Promise(function (resolve, reject, notify) {
		if (typeof conn === 'undefined') {
			return reject(new Error('Kiddy: invalid connection handle') );
		}
		if (typeof conn.release === 'undefined') {
			return reject(new Error('Kiddy: unknown connection handle') );
		}
		conn.release();
		return resolve('Connection released');
	});
};
/*\
|*| Drain the connection pool.
\*/
export const drain = function (opt) {
	return Q.Promise(function (resolve, reject, notify) {
		if (typeof opt !== 'undefined' && opt !== false) {
			_clearConfig();
		}
		if (typeof pool === 'undefined') {
			return resolve('Drained')
		};
		if (typeof pool.end === 'function') {
			Q.ninvoke(pool, 'end')
			.then(function (status) {
				pool = undefined;
				return resolve('Drained')
			})
			.fail(function (err) {
				pool = undefined;
				return reject(err);
			});
		} else {
			pool = undefined;
			return reject(new Error('Kiddy: connection pool is invalid') );
		}
	});
};
/*\
|*| Get the current mysql connection information. Wrapped in a promise to keep
|*| the `thenable` program flow used in other database function calls.
\*/
const _checkConfig = function () {
	return Q.Promise(function (resolve, reject, notify) {
		/*\
		|*| Resolve the cache or load the config from disk
		\*/
		if (typeof configCache === 'undefined') {
			/*\
			|*| Test for valid configuration
			\*/
			let key = "";
			if (config.has('rdb') ) {
				key = config.rdb;
			} else if (config.has('database') ) {
				key = config.database;
			} else if (config.has('mysql') ) {
				key = config.mysql;
			} else {
				return reject(new Error('Kiddy: unable to locate databse configuration in config file') );
			}
			if (typeof key === 'undefined') {
				return reject(new Error('Kiddy: missing database configuration') );
			} else {
				let creds = {
					host: key.host || "localhost",
					port: key.port || 3306,
					user: key.user,
					password: key.password,
					database: key.database || ""
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
const _touchPool = function (info) {
	return Q.Promise(function (resolve, reject, notify) {
		if (typeof pool === 'undefined') {
			try {
				pool = mysql.createPool({
					host: info.host,
					port: info.port,
					user: info.user,
					password: info.password,
					database: info.database
				});
			} catch (e) {
				return reject(e);
			}
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
			return reject(new Error('Kiddy: connection pool was drained or is invalid') );
		}
	});
};
/*\
|*| Return the vanilla mysql connection wrapped with the additional method:
|*| conn.pq - promise wrapped call to conn.query
\*/
const _wrapConnection = function (conn) {
	return Q.Promise(function (resolve, reject, notify) {
		if (typeof conn.query === 'function') {
			conn.pq = function (options, values) {
				return Q.ninvoke(this, 'query', options, values);
			}
			return resolve(conn);
		} else {
			return reject(new Error('Kiddy: invalid msyql connection passed to _wrapConnection') );
		}
	});
};
const _clearConfig = function () {
	if (typeof configCache !== 'undefined') {
		/*\
		|*| JS does not really have a secure way to remove strings
		\*/
		delete configCache.host;
		delete configCache.port;
		delete configCache.user;
		delete configCache.password;
		delete configCache.database;
		configCache = undefined;
	}
};
