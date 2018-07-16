var chance =  new (require('chance'))();
var Q = require('q');
var http = require('request-q');
var utils = require('./utils.js');
var systemColumns = require('./system_columns.js');

/* @namespace Table
 * @desc
 * The Table module allows you to create and delete tables for the ERMrest API
 * service.
 * @param {options} A json object which should contain a Catalog object, a Schema object and optionally the table json  { catalog: @Catalog, schema: @Schema, table: { table_name: 'sample_name' } }.
 * @constructor
 */
var Table = function(options) {
	options = options || {};
	this.url = options.url;
	this.content = options.table || {};
	this.schema = options.schema || {};
	this.catalog = this.schema.catalog || {};
	this.name = this.content.table_name;
	this.foreignKeys = this.content.foreign_keys || [];
	this.content.schema_name = this.schema.name;
	this.setTableParameters = function(name) {
		this.content = {
		  "comment": "",
		  "kind": "table",
		  "keys": [],
		  "foreign_keys": [],
		  "table_name": name,
		  "schema_name": this.schema.name,
		  "column_definitions": [],
		  "annotations": {}
		};
		this.name = name;
	};
};

Table.prototype.addSystemColumsAndKeys = function() {
	this.content.column_definitions = this.content.column_definitions || [];

	var localSystemColumns = JSON.parse(JSON.stringify(systemColumns));
	var localSystemCoumnnNames = localSystemColumns.map(c => c.name);

	var systemColumnsFound = this.content.column_definitions.filter((c) => (localSystemCoumnnNames.indexOf(c.name) !== -1)).map(c => c.name);
	localSystemColumns.forEach(c => {
		if (systemColumnsFound.indexOf(c.name) === -1) {
			this.content.column_definitions.push(c);
		}
	});

	this.content.keys = this.content.keys || [];

	var found = this.content.keys.find(k => ((k.unique_columns.legnth === 1) && (k.unique_columns.indexOf("RID") !== -1)));

	if (!found) {
		this.content.keys.push({ unique_columns: ["RID"], annotations: {} });
	}
};

/**
 * @param {timeout} Optional : Used to add a wait between creation of table to avoid conflicts
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it creates a new table.
 */
Table.prototype.create = function(timeout) {
	var defer = Q.defer(), self  = this;

	if (!this.catalog.id || !this.schema.name || !this.name) return defer.reject("No catalog or schema set : create table function"), defer.promise;

	this.content.schema_name = this.schema.name;
	this.foreignKeys = this.content.foreign_keys;
	this.content.foreign_keys = [];

    console.time("add_sys_columns");
	this.addSystemColumsAndKeys();
    console.timeEnd("add_sys_columns");

	setTimeout(function() {

		http.post(self.url + '/catalog/' + self.catalog.id + "/schema/" + utils._fixedEncodeURIComponent(self.schema.name) + "/table", self.content).then(function(response) {
			self.content = response.data;
			self.name = self.content.table_name;
			console.log("Table " + self.content.table_name + " created");
			defer.resolve(self);
		}, function(err) {
			defer.reject(err, self);
		});

	}, timeout || 0);

	return defer.promise;
};

/**
 *
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it deletes the tables.
 */
Table.prototype.remove = function() {
	var defer = Q.defer(), self = this;
	if (!this.catalog.id || !this.schema.name || !this.name) return defer.reject("No catalog or schema or table name set : create table function"), defer.promise;

	http.delete(this.url + '/catalog/' + this.catalog.id + "/schema/" + utils._fixedEncodeURIComponent(this.schema.name) + "/table/" + utils._fixedEncodeURIComponent(this.name)).then(function() {
		console.log("Table " + self.content.table_name + " deleted");
		defer.resolve(self);
	}, function(err) {
		defer.reject(err, self);
	});

	return defer.promise;
};

/**
 * @param {foreignKey}: A foreignKey that will be created for this table
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it creates a new foreignkey.
 */
Table.prototype.addForeignKey = function(foreignKey) {
	var defer = Q.defer(), self = this;

	var url = this.url + '/catalog/' + this.catalog.id + "/schema/" + utils._fixedEncodeURIComponent(this.schema.name) + "/table/" + utils._fixedEncodeURIComponent(this.name) + "/foreignkey";
	http.post(url, foreignKey).then(function(response) {
		self.content.foreign_keys.push(response.data);
		defer.resolve(self);
	}, function(err) {
		console.log(url);
		console.log(foreignKey);
		defer.reject(err, self);
	});

	return defer.promise;
};

/**
 * @param {acls} An array of acl objects
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it adds the acls for the table.
 */
Table.addACLs = function(url, catalogId, schemaName, tableName, acls) {
	var defer = Q.defer();
	if (!catalogId) return defer.reject("No catalogId set : addACL Table function"), defer.promise;
	if (!acls || acls.length == 0) defer.resolve();

	var promises = [];

	for (var acl in acls) {
		promises.push(Table.addACL(url, catalogId, schemaName, tableName, acl, acls[acl]));
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
 * An asynchronous method that returns a promise. If fulfilled, it adds the acl for the table.
 */

Table.addACL = function(url, catalogId, schemaName, tableName, aclKey, value) {
	var defer = Q.defer();
	if (!catalogId || (typeof aclKey !== 'string')) return defer.reject("No catalogId or ACL set : addACL Table function"), defer.promise;

	http.put(url + '/catalog/' + catalogId + "/schema/" + utils._fixedEncodeURIComponent(schemaName) + "/table/" + utils._fixedEncodeURIComponent(tableName) + "/acl/" + aclKey,  value).then(function(response) {
		defer.resolve();
	}, function(err) {
		defer.reject(err);
	});

	return defer.promise;
};

/**
 *
 * @desc
 * Not yet implemented.
 */
Table.prototype.get = function() {
	throw new Error("Not Implemented");
};

module.exports = Table;
