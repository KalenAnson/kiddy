import test from 'ava';
import * as kiddy from '../lib/kiddy.js';
import config from 'config';
/*\
|*| Make sure config is loaded
\*/
test('config is loaded', t => {
	t.is(typeof config, 'object');
});
/*\
|*| Make sue that the config file is parsable
\*/
test('config file located', t => {
	t.truthy(config.has('rdb') );
});
/*\
|*| Make sure kiddy is loaded
\*/
test('kiddy is loaded', t => {
	t.is(typeof kiddy, 'object');
});
/*\
|*| kiddy.setConfig
\*/
test('kiddy.setConfig', t => {
	t.is(typeof kiddy.setConfig, 'function');
});
/*\
|*| kiddy.touch
\*/
test('kiddy.touch', t => {
	t.is(typeof kiddy.touch, 'function');
});
/*\
|*| kiddy.release
\*/
test('kiddy.release', t => {
	t.is(typeof kiddy.release, 'function');
});
/*\
|*| kiddy.drain
\*/
test('kiddy.drain', t => {
	t.is(typeof kiddy.drain, 'function');
});
/*\
|*| rejects invalid options
\*/
test('rejects null options', async t => {
	const error = await t.throwsAsync(kiddy.setConfig() );
	t.is(error.message, 'Kiddy: missing options');
});
/*\
|*| rejects undefined user
\*/
test('rejects null user', async t => {
	const error = await t.throwsAsync(kiddy.setConfig({}) );
	t.is(error.message, 'Kiddy: invalid options, the user option is mandatory');
});
/*\
|*| accepts valid options
|*| Must be the last call to kiddy.setConfig before other tests.
\*/
test('accepts valid options', async t => {
	const value = await kiddy.setConfig(config.rdb);
	t.is(value, 'Options set successfully');
});
/*\
|*| rejects touch
\*/
test('touch rejected', async t => {
	const error = await t.throwsAsync(kiddy.touch() );
	t.truthy(error instanceof Object);
	t.is(typeof error.message, 'string');
});
/*\
|*| rejects invalid release
\*/
test('release rejected', async t => {
	const error = await t.throwsAsync(kiddy.release({}) );
	t.is(error.message, 'Kiddy: unknown connection handle');
});
/*\
|*| allows drains to empty pool
\*/
test('drains empty pool', async t => {
	const value = await kiddy.drain(true);
	t.is(value, 'Drained');
});
