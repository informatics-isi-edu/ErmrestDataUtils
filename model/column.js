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

    var columnURL = url + '/catalog/' + catalogId + "/schema/";
    columnURL += utils._fixedEncodeURIComponent(schemaName) + "/table/";
    columnURL += utils._fixedEncodeURIComponent(tableName) + "/column/";
    columnURL += utils._fixedEncodeURIComponent(columnName);
	http.put(columnURL + "/acl/" + aclKey,  value).then(function(response) {
		defer.resolve();
	}, function(err) {
		defer.reject(err);
	});

	return defer.promise;
};

Column.addACLBindings = function (url, catalogId, schemaName, tableName, columnName, bindings) {
    return new Promise(function (resolve, reject) {
      if (typeof bindings != 'object' || !bindings) return resolve("No ACL bindings to add");
      if (!catalogId) return reject("No catalogId set : addACLBindings Clolumn function");

      // passing an empty {} bindings should be allowed.
      // it allows us to remove any existing bindings

      var columnURL = url + '/catalog/' + catalogId + "/schema/";
      columnURL += utils._fixedEncodeURIComponent(schemaName) + "/table/";
      columnURL += utils._fixedEncodeURIComponent(tableName) + "/column/";
      columnURL += utils._fixedEncodeURIComponent(columnName);
      http.put(columnURL + "/acl_binding/", bindings).then(function (response) {
          resolve();
      }).catch(function (err) {
          reject(err);
      });
    });
};


module.exports = Column;
