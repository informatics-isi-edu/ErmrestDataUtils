var Q = require('q');
var http = require('axios');
var utils = require('./utils.js');

/* @namespace Entities
 * @Entities
 * The Entity module allows you to create and delete entities for the ERMrest API
 * service.
 * @param {options} A json object which should contain a table object  { table: @Table, entity: { } }.
 * @constructor
 */
var Entities = function(options) {
	options = options || {};
	this.url = options.url;
	this.table = options.table || {};
	this.schema = this.table.schema;
	this.catalog = this.table.catalog;
};

var create = function(entities, self) {
	var autogenColumns = [], defer = Q.defer();
	self.table.content.column_definitions.forEach(function(c) {
		if (!entities[0].hasOwnProperty(c.name)) {
			if (c.type.typename.indexOf('serial') === 0 && !entities[0].hasOwnProperty(c.name)) {
				autogenColumns.push(utils._fixedEncodeURIComponent(c.name));
			} else if (c.default !== null && c.default !== undefined) {
				autogenColumns.push(utils._fixedEncodeURIComponent(c.name));
			}
		}
	});

	var autogenParam = (autogenColumns.length) ? ("?defaults=" + autogenColumns.join(',')) : "";

    var url = self.url + "/catalog/" + self.catalog.id + "/entity/" + utils._fixedEncodeURIComponent(self.schema.name) + ":" + utils._fixedEncodeURIComponent(self.table.name) + autogenParam;
	http.post(url, entities).then(function(response) {
		defer.resolve(response.data);
	}, function(err) {
        console.log(url);
        console.log(entities);
		defer.reject(err, self);
	});

	return defer.promise;
};

/**
 @param {options} A json object which should contain a list of json entities { entities: [{ .. }] }.
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it creates new entities.
 */
Entities.prototype.create = function(options) {
	options = options || {};
	var defer = Q.defer(), self  = this;
	if (!this.table) return defer.reject("No table provided as argument : bulkCreate entity function"), defer.promise;
	if (!options.entities) return defer.reject("No entities provided as argument : bulkCreate entity function").promise;
	if (options.entities.length == 0) {
		defer.resolve([]);
		return defer.promise;
	}

	create(options.entities, this).then(function(data) {
		self.table.entityCount = options.entities.length;
		defer.resolve(data);
	}, function(err) {
		defer.reject(err, self);
	});

	return defer.promise;
};



/**
 *
 * @desc
 * Not yet implemented.
 */
Entities.prototype.remove = function(options) {
	throw new Error("Not Implemented");
};

/**
 *
 * @desc
 * Not yet implemented.
 */
Entities.prototype.get = function() {
	throw new Error("Not Implemented");
};

module.exports = Entities;
