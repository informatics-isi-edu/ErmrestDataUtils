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
 * @param {Object} acl object
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it adds the acls for the Column.
 */
Column.addACLs = function(url, catalogId, schemaName, tableName, columnName, acls) {
  return new Promise(function (resolve, reject) {
    if (typeof acls != 'object' || !acls) resolve();
    if (!catalogId) return reject("No catalogId set : addACL Column function");

    var aclKeys = Object.keys(acls);
    var next = function () {
        if (aclKeys.length === 0) {
          resolve();
        } else {
          var aclKey = aclKeys.shift();
          Column.addACL(url, catalogId, schemaName, tableName, columnName, aclKey, acls[aclKey]).then(function () {
            next();
          }).catch(function (err) {
            reject(err);
          })
        }
    }
    next();
  });
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
