var chance =  new (require('chance'))();
var Q = require('q');
var http = require('request-q');
var utils = require('./utils.js');


/* @namespace Schema
 * @desc
 * The Schema module allows you to create and delete schemas for the ERMrest API
 * service.
 * @param {options} A json object which should contain a catalog and  optionally the name of the schema { catalog: @Catalog, name: 'schema_name' }.
 * @constructor
 */
var Schema = function(options) {
	options = options || {};
	this.url = options.url;
	this.content = options.schema || {};
	this.entityCount = this.content.entityCount || 0;
	this.catalog = options.catalog || {};
	this.name = this.content.schema_name || this.content.name || chance.string().replace(/[^a-zA-Z ]/g, "");
};

/**
 * @param {schemaName} Optional : Used if you didn't provide while creating the object
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it creates a new schema.
 */
Schema.prototype.create = function(schemaName) {
	var defer = Q.defer(), self = this;
	this.name = schemaName || this.name;
	if (!this.catalog.id || !this.name) return defer.reject("No Catalog or Name set : create schema function"), defer.promise;
    var schemaUrl = this.url + '/catalog/' + this.catalog.id + "/schema/" + utils._fixedEncodeURIComponent(this.name);
	http.post(schemaUrl).then(function(response) {
		return self.createAnnotation();
	}).then(function() {
		return self.createComment();
	}).then(function() {
		return self.addACLs();
	}).then(function() {
		defer.resolve(self);
	}, function(err) {
        console.log("Table url: ", schemaUrl);
		defer.reject(err, self);
	});

	return defer.promise;
};

/**
 *
 * @desc
 * Delete a schema.
 */
Schema.prototype.remove = function() {
	var defer = Q.defer(), self = this;
	if (!this.catalog.id || !this.name) return defer.reject("No Catalog or Name set: remove schema function"), defer.promise;

	http.delete(this.url + '/catalog/' + this.catalog.id + "/schema/" + utils._fixedEncodeURIComponent(this.name)).then(function() {
		defer.resolve(self);
	}, function(err) {
		defer.reject(err, self);
	});

	return defer.promise;
};

var annotate = function(self, key, value) {
	var d = Q.defer();
    var url = self.url + '/catalog/' + self.catalog.id + "/schema/" + utils._fixedEncodeURIComponent(self.name) + "/annotation/" + utils._fixedEncodeURIComponent(key);
	http.put(url, value).then(function(response) {
		d.resolve();
	}, function(err) {
        console.log(url);
        console.log(value);
		d.reject(err);
	});
	return d.promise;
};

/**
 *
 * @desc
 * Create annotations specified in the content.
 */
Schema.prototype.createAnnotation = function() {
	var annotations = this.content.annotations || {}, defer = Q.defer(), self = this, promises = [];
	for (var k in annotations) {
		if (annotations[k] != null) promises.push(annotate(self, k, annotations[k]));
	}

	Q.all(promises).then(function() {
		defer.resolve(self);
	}, function(err) {
		defer.reject(err);
	});
	return defer.promise;
};

Schema.prototype.createComment = function() {
	var d = Q.defer();
	if (this.content.comment && this.content.comment.trim() != '') {
        var url = this.url + '/catalog/' + this.catalog.id + "/schema/" + utils._fixedEncodeURIComponent(this.name) + "/comment";
        var body = this.content.comment;
		http.put({ url: url, body: body, json: false }).then(function(response) {
			d.resolve();
		}, function(err) {
            console.log(url);
            console.log(body);
			d.reject(err);
		});
	} else {
		d.resolve();
	}
	return d.promise;
};

/**
 *
 * @desc
 * Sets and Returns the default table for a schema.
 */
Schema.prototype.setDefaultTable = function() {
	var defaultTable = null, rootTables = [], tables = this.content.tables;

	for (var k in tables) {
		table = tables[k];
		var exclude = table['annotations'] != null && table['annotations']['comment'] != null &&
			(table['annotations']['comment'].contains('exclude') || table['annotations']['comment'].contains('association'));
		var nested = table['annotations'] != null && table['annotations']['comment'] != null &&
			table['annotations']['comment'].contains('nested');

		if (!exclude && !nested) {
			rootTables.push(table['table_name']);
			if (table['annotations'] != null && table['annotations']['comment'] != null && table['annotations']['comment'].contains('default')) {
				defaultTable = table;
			}
		}
	};

	if (defaultTable == null) defaultTable = tables[rootTables[0]];
	this.defaultTable = defaultTable;
	return this.defaultTable;
};

Schema.prototype.addACLs = function() {
	return Schema.addACLs(this.url, this.catalog.id, this.name, this.content.acls);
};

/**
 * @param {acls} An array of acl objects
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it adds the acls for the schema.
 */
Schema.addACLs = function(url, catalogId, schemaName, acls) {
	var defer = Q.defer();
	if (!catalogId) return defer.reject("No Id set : addACL Schema function"), defer.promise;
	if (!acls || acls.length == 0) defer.resolve();

	var promises = [];

	for (var acl in acls) {
		promises.push(Schema.addACL(url, catalogId, schemaName, acl, acls[acl]));
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
 * An asynchronous method that returns a promise. If fulfilled, it adds the acl for the schema.
 */

Schema.addACL = function(url, catalogId, schemaName, aclKey, value) {
	var defer = Q.defer();
	if (!catalogId || (typeof aclKey !== 'string')) return defer.reject("No Id or ACL set : addACL Schema function"), defer.promise;

    var aclUrl = url + '/catalog/' + catalogId + "/schema/" + utils._fixedEncodeURIComponent(schemaName) + "/acl/" + aclKey;
	http.put(aclUrl, value).then(function(response) {
		defer.resolve();
	}, function(err) {
        console.log(aclUrl);
        console.log(value);
		defer.reject(err);
	});

	return defer.promise;
};

/**
 *
 * @desc
 * Not yet implemented.
 */
Schema.prototype.get = function() {
	throw new Error("Not Implemented");
}

module.exports = Schema;
