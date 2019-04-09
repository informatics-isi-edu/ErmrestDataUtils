var Q = require('q');
var http = require('request-q');
var utils = require('./utils.js');
var Schema = require('./schema.js');

/* @namespace Catalog
 * @desc
 * The Catalog module allows you to create and delete catalogs for the ERMrest API
 * service.
 * @param {options} A json object which may optionally contain the id of the catalog { id: 21 }.
 * @constructor
 */
var Catalog = function(options) {
	this.content = options || {};
	this.url = options.url;
	this.id = this.content.id;
};

/**
 *
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it creates a new catalog.
 */
Catalog.prototype.create = function() {
	var defer = Q.defer(), self = this;

	if (this.id) {
		defer.resolve(this);
		return defer.promise;
	}

	console.log("=========Inside catalog create=============");

	http.post(this.url + '/catalog').then(function(response) {
		self.content = response.data;
		self.id = response.data.id;
		defer.resolve(self);
	}, function(err) {
		defer.reject(err, self);
	});

	return defer.promise;
};

Catalog.prototype.addAnnotations = function(annotations) {
    return Catalog.addAnnotations(this.url, this.id, annotations);
};

/**
 * @param {Array} annotation - An array of annotation objects
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it adds the annotations for the catalog.
 */
Catalog.addAnnotations = function(url, id, annotations) {
    return new Promise(function (resolve, reject) {
        if (typeof annotations != 'object' || !annotations) return resolve();

        var keys = Object.keys(annotations);
        var next = function () {
            if (keys.length === 0) return resolve();

            var key = keys.shift();
            Catalog.addAnnotation(url, id, key, annotations[key]).then(next).catch(function (err) {
                reject(err);
            });
        }
        next();
    });
}

/**
 * @param {string} key - the key of the annotation
 * @param {Object} value - object containing the annotation definition (will be sent to ermret without any change).
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it adds the acl for the catalog.
 */
Catalog.addAnnotation = function(url, id, key, value) {
    var defer = Q.defer();
    if (!id || (typeof key !== 'string')) return defer.reject("No Id or Annotation set : addAnnotation catalog function"), defer.promise;

    console.log("value: ", value);
    http.put(url + '/catalog/' + id + "/annotation/" + utils._fixedEncodeURIComponent(key), value).then(function(response) {
        defer.resolve();
    }, function(err) {
        defer.reject(err);
    });

    return defer.promise;
};

Catalog.prototype.addACLs = function(acls) {
    return Catalog.addACLs(this.url, this.id, acls);
};

/**
 * @param {acls} An array of acl objects
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it adds the acls for the catalog.
 */
Catalog.addACLs = function(url, id, acls) {
  return new Promise(function (resolve, reject) {
    if (typeof acls != 'object' || !acls) return resolve("No ACLs to add");
    if (!id) return reject("No Id set : addACL catalog function");

    var aclKeys = Object.keys(acls);
    var next = function () {
        if (aclKeys.length === 0) return resolve();

        var aclKey = aclKeys.shift();
        Catalog.addACL(url, id, aclKey, acls[aclKey]).then(next).catch(function (err) {
          reject(err);
        });
    }
    next();
  });
};

/**
 * @param {string} key the key of the ACL.
 * @param {string[]} value the array of users that have that ACL (will be sent to ermret without any change).
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it adds the acl for the catalog.
 */
Catalog.addACL = function(url, id, aclKey, value) {
	var defer = Q.defer();
	if (!id || (typeof aclKey !== 'string')) return defer.reject("No Id or ACL set : addACL catalog function"), defer.promise;

	http.put(url + '/catalog/' + id + "/acl/" + aclKey,  value).then(function(response) {
		defer.resolve();
	}, function(err) {
		defer.reject(err);
	});

	return defer.promise;
};

/**
 *
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it deletes the catalog.
 */
Catalog.prototype.remove = function() {
	var defer = Q.defer(), self = this;
	if (!this.id) return defer.reject("No Id set : remove catalog function"), defer.promise;

	http.delete(this.url + '/catalog/' + this.id).then(function() {
		defer.resolve(self);
	}, function(err) {
		defer.reject(err, self);
	});

	return defer.promise;
};

/**
 *
 * @desc
 * A synchronous method that sets the default schema on basis of current catalog schemas.
 */
Catalog.prototype.setSchemas = function() {
	var defaultSchema = null, schemas = this.content.schemas;
	this.schemas = {};
	for (var k in schemas) {
		var schema = new Schema({ schema: schemas[k], catalog: this, name: schemas[k].schema_name });
		var annotations = schemas[k].annotations;

		if (!defaultSchema && annotations != null && annotations['comment'] != null && annotations['comment'].contains('default')) {
			defaultSchema = schema
		}

		schema.setDefaultTable();

		this.schemas[schema.name] = schema;
	}

	if (defaultSchema == null) {
		for (var k in schemas) {
			var s = schemas[k];
			for (var t in s.tables) {
				var table = s.tables[t];
				if (table['annotations'] != null && table['annotations']['comment'] != null && table['annotations']['comment'].contains('default')) {
					defaultSchema = this.schemas[k];
					break;
				}
			}
			if (defaultSchema != null) break;
		}

		if (defaultSchema == null) {
			// get the first schema from the catalog
			for (var k in schemas) {
				defaultSchema = this.schemas[k];
				break;
			}
		}
	}

	this.defaultSchema = defaultSchema;
};

/**
 *
 * @desc
 * Retrieves all schema and tables for them respectively.
 */
Catalog.prototype.get = function() {
	var defer = Q.defer(), self = this;
	if (!this.id) return defer.reject("No Id set : get catalog function"), defer.promise;
	http.get(this.url + '/catalog/' + this.id + "/schema").then(function(response) {
		self.content = response.data;
		self.setSchemas();
		defer.resolve(self.defaultSchema, self);
	}, function(err) {
		console.log("some error");
		defer.reject(err, self);
	});

	return defer.promise;
};



module.exports = Catalog;
