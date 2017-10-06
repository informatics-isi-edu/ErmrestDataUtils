var Q = require('q');
var http = require('request-q');
var utils = require('./utils.js');

/* @namespace Column
 * @desc
 * The Column module for the ERMrest API
 * service.
 * @constructor
 */
var Column = function() {};

/**
 * @param {acls} An array of acl objects
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it adds the acls for the Column.
 */
Column.addACLs = function(url, catalogId, schemaName, tableName, columnName, acls) {
	var defer = Q.defer();
	if (!catalogId) return defer.reject("No catalogId set : addACL Column function"), defer.promise;
	if (!acls || acls.length == 0) defer.resolve();

	var promises = [];

	for (var acl in acls) {
		promises.push(Column.addACL(url, catalogId, schemaName, tableName, columnName, acl, acls[acl]));
	}

	Q.all(promises).then(function() {
		defer.resolve();
	}, function(err) {
		defer.reject(err);
	});

	return defer.promise;
};

/**
 * @param {string} key the key of the ACL.
 * @param {string[]} value the array of users that have that ACL (will be sent to ermret without any change).
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it adds the acl for the Column.
 */

Column.addACL = function(url, catalogId, schemaName, tableName, columnName, aclKey, value) {
	var defer = Q.defer();
	if (!catalogId || (typeof aclKey !== 'string')) return defer.reject("No catalogId or ACL set : addACL Column function"), defer.promise;
	
	http.put(url + '/catalog/' + catalogId + "/schema/" + utils._fixedEncodeURIComponent(schemaName) + "/table/" + utils._fixedEncodeURIComponent(tableName) + "/column/" + utils._fixedEncodeURIComponent(columnName) + "/acl/" + aclKey,  value).then(function(response) {
		defer.resolve();
	}, function(err) {
		defer.reject(err);
	});

	return defer.promise;
};


module.exports = Column;