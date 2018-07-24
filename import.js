
exports.http = require('request-q');

delete require.cache['request-q'];

var http = require('request-q');
var Catalog = require('./model/catalog.js');
var Schema = require('./model/schema.js');
var Table = require('./model/table.js');
var Column = require('./model/column.js');
var Entites = require('./model/entities.js');
var Association = require('./model/association.js');
var Q = require('q');

var ermRest = require('./model/ermrest.js');
ermRest.configure(http, require('q'))

var config = {};

exports.download = require('./export.js').download;

/**
 * @desc
 * Fetches the schemas for a catalog as well as tables for those schemas and sets
 * default schema and default table for a schema.
 * @returns {Promise} Returns a promise.
 * @param {options} A json Object which contains the url, optional authCookie and optional catalogId
 */
exports.introspect = function(options) {
	var defer = Q.defer();

	config = options;
	config.url = config.url || 'https://dev.isrd.isi.edu/ermrest';
	config.authCookie = config.authCookie;

	http.setDefaults({
	    headers: { 'Cookie': config.authCookie || "a=b;" },
	    json: true,
	    _retriable_error_codes : [0,500,503]
	});

	var catalog = new Catalog({
		url: config.url,
		id: config.catalogId
	});

	// introspect
	catalog.get().then(function(schema) {
		defer.resolve(schema);
    }, function(err) {
        console.dir(err);
        defer.reject(err);
    });

    return defer.promise;
};

/**
 * @desc
 * Creates new catalog if catalogId is not provided in the Catalog object,
 * creates a new schema if createNew is true in the schema object and
 * creates new tables and foreign keys if createNew is true in the tables object.
 * Entities are also imported for specified tables if createNew is true in entities object.
 * @returns {Promise} Returns a promise.
 * @param {options} A json Object which contains the url, optional authCookie and configuraion object
 *
 	{
	    "catalog": {
	    	//"id": 1  //existing id of a catalog
	    },
	    "schema": {
	        "name": "product",
	        "createNew": true, // change this to false to avoid creating new schema
	        "path": "./schema/product.json" // path of the schema json file in data_setup folder
	    },
	    "tables": {
	    	"createNew": true, // Mention this to be true to allow creating new tables
	    },
	    "entities": {
	    	"createNew": true, // Mention this to be true to allow creating new entities
	        "path": "./data/product", // This is the path from where the json for the entities will be picked for import
	    },
	    "authCookie": ""
	}
 *
 */
exports.setup = function(options) {
	config = options;
	config.url = config.url || 'https://dev.isrd.isi.edu/ermrest';
	config.authCookie = config.authCookie;

	http.setDefaults({
	    headers: { 'Cookie': config.authCookie || "a=b;" },
	    json: true,
	    _retriable_error_codes : [0,500,503]
	});

	var schema, catalog;

	if (config.catalog) {
		catalog = new Catalog({
			url: config.url,
			id: config.catalog.id
		});

		if (config.schema) {
			config.schemaName = config.schema.name || "product";

		 	schema = new Schema({
				url: config.url,
				catalog: catalog,
				schema:  require(process.env.PWD + "/" + (config.schema.path || ('./schema/' + config.schemaName  + '.json')))
			});
		}
	}

	var defer = Q.defer();

	http.get(config.url.replace('ermrest', 'authn') + "/session").then(function(response) {
   		console.log("Valid session found");
		return createCatalog(catalog);
	}, function(err) {
		console.log("In error with no cookie:" + ((!config.authCookie) ? true : false));
		console.log(err ? (err.message + "\n" + err.stack) : "Cannot find session");
		if (!config.authCookie) {
			return createCatalog(catalog);
		} else {
			return defer.reject(err || {});
		}
	}).then(function() {
		return createSchema(schema);
	}).then(function() {
		return createTables(schema);
	}).then(function() {
		if(config.catalog.id) {
			console.log("==========Schema " + schema.name + " imported in catalog with Id : " +catalog.id + "======================");
		} else {
			console.log("=======================Catalog imported with Id : " + catalog.id + "===========================");
		}
		if (!config.catalog) defer.resolve({ catalogId: 1, schema:  null });
		else defer.resolve({ catalogId: catalog.id, schema: schema });
	}, function(err) {
		console.dir(err);
		if (catalog && catalog.id) defer.reject({ catalogId: catalog.id });
		else defer.reject(err || {});
	});

	return defer.promise;
};

exports.importData = function(options) {
	var configuration = options.setup;
	configuration.url = options.url;
	configuration.authCookie = options.authCookie;
	console.log(options.authCookie);
	return exports.setup(configuration);
};

exports.importACLS = function(options) {
	var defer = Q.defer();
	http.setDefaults({
	    headers: { 'Cookie': options.authCookie || "a=b;" },
	    json: true,
	    _retriable_error_codes : [0,500,503]
	});

	var config = options.setup, url = options.url;

	var promises = [];

	if (config.catalog && config.catalog) {
		var catalog = config.catalog;
		promises.push(Catalog.addACLs(url, catalog.id, catalog.acls));

		for (var schemaName in catalog.schemas) {
			var schema = catalog.schemas[schemaName];
			promises.push(Schema.addACLs(url, catalog.id, schemaName, schema.acls));

			for (var tableName in schema.tables) {
				var table = schema.tables[tableName];
				promises.push(Table.addACLs(url, catalog.id, schemaName, tableName, table.acls));

				for (var columnName in table.columns) {
					var column = table.columns[columnName];
					promises.push(Column.addACLs(url, catalog.id, schemaName, tableName, columnName, column.acls));
				}
			}
		}
	}

	if (promises.length === 0) defer.resolve();

	Q.all(promises).then(function() {
		defer.resolve();
	}, function(err) {
		defer.reject(err);
	});

	return defer.promise;
};

/**
 * @desc
 * Tears/deletes new catalog if catalogId is not provided in the Catalog object of setup,
 * deletes new schemas if createNew is true in the schema object of setup and
 * deletes new tables and foreign keys if createNew is true in the tables object of setup.
 * Entities are also removed for specified tables if createNew is true in entities object of setup.
 * @returns {Promise} Returns a promise.
 * @param {options} A json Object which contains the url, optional authCookie and setup configuraion object
 *
 	"setup": {
	    "catalog": {
	    	//"id": 1  //existing id of a catalog
	    },
	    "schema": {
	        "name": "product",
	        "createNew": true, // change this to false to avoid creating new schema
	        "path": "./schema/product.json" // path of the schema json file in data_setup folder
	    },
	    "tables": {
	    	"createNew": true, // Mention this to be true to allow creating new tables
	    },
	    "entities": {
	    	"createNew": true, // Mention this to be true to allow creating new entities
	        "path": "./data/product", // This is the path from where the json for the entities will be picked for import
	    },
	    "authCookie": ""
	}
 *
 */
exports.tear = function(options) {
	config = options;
	config.url = config.url || 'https://dev.isrd.isi.edu/ermrest';
	config.authCookie = config.setup.authCookie || config.authCookie;

	var defer = Q.defer();

	http.setDefaults({
	    headers: { 'Cookie': config.authCookie || "a=b;" },
	    json: true,
	    _retriable_error_codes : [0,500,503]
	});

	if (!config.setup.catalog) {
		defer.resolve();
	} else if (!config.setup.catalog.id) {
		removeCatalog(defer, options.catalogId);
	} else if (config.setup.schema.createNew) {
		removeSchema(defer, options.catalogId, config.setup.schema)
	} else if (!config.setup.tables.newTables || config.setup.tables.newTables.length > 0) {
		removeTables(defer, options.catalogId, config.setup.schema);
	} else {
		defer.resolve();
	}

	return defer.promise;
};

/**
 * @desc
 * Deletes a catalog.
 * @returns {null}
 * @param {promise, Catalog}
 */
var removeCatalog = function(defer, catalogId) {
	var catalog = new Catalog({ url: config.url, id: catalogId });
	catalog.remove().then(function() {
		console.log("Catalog deleted with id " + catalog.id);
		defer.resolve();
	}, function(err) {
		console.log("Unable to delete the catalog with id " + catalog.id);
		defer.reject(err);
	});

	return defer.promise;
};

/**
 * @desc
 * Deletes a schema .
 * @returns {null}
 * @param {promise, catalogId, schemaName}
 */
var removeSchema = function(defer, catalogId, schemaName) {
	var catalog = new Catalog({ url: config.url, id: catalogId });
	var schema = new Schema({
		url: config.url,
		catalog: catalog,
		schema: require(process.env.PWD + "/" + (config.setup.schema.path || ('./schema/' + config.setup.schemaName  + '.json')))
	});

	var otherDefer = Q.defer();

	removeTables(otherDefer,  catalogId, schema.name).then(function() {
		return schema.remove();
	}).then(function() {
		console.log("Schema deleted with name " + schema.name);
		defer.resolve();
	}, function(err) {
		console.log("Unable to delete the schema with name " + schema.name);
		defer.reject(err);
	});

	return defer.promise
};

/**
 * @desc
 * Deletes tables that were created according to the configuration .
 * @returns {null}
 * @param {promise, catalogId, schemaName}
 */
var removeTables = function(defer, catalogId, schemaName) {
	var promises = [], catalog = new Catalog({ url: config.url, id: catalogId });
	var schema = new Schema({
		url: config.url,
		catalog: catalog,
		schema: require(process.env.PWD + "/" + (config.setup.schema.path || ('./schema/' + config.setup.schemaName  + '.json')))
	});

	delete require.cache[require.resolve(process.env.PWD + "/" + (config.setup.schema.path || ('./schema/' + config.schemaName  + '.json')))];
	var association = new Association({ schema: require(process.env.PWD + "/" + (config.setup.schema.path || ('./schema/' + config.schemaName  + '.json'))) });
	var tablesToBeDeleted = [],tables = {}, tableNames = [];

	for (var k in schema.content.tables) {
		var table = new Table({
			url: config.url,
			schema: schema,
			table: schema.content.tables[k]
		});

		if (!schema.content.tables[k].exists || (config.setup.tables.newTables.indexOf(k) != -1)) {
			tableNames.push(table.name);
			tables[table.name] = table;
		}
	}

	var deleteTable = function() {
		if (tablesToBeDeleted.length == 0) return defer.resolve();
		var name = tablesToBeDeleted.shift();

		var table = tables[name];
		table.remove().then(function() {
			deleteTable();
		}, function(err) {
			console.log(err);
			defer.reject(err);
		});
	};

	var setDeleteOrder = function() {
		if (tableNames.length == 0) {
			tablesToBeDeleted = tablesToBeDeleted.reverse();
			deleteTable();
			return;
		}

		var name = tableNames.shift();
		if (association.hasAReference(name, tablesToBeDeleted)) {
			tableNames.push(name);
		} else {
			tablesToBeDeleted.push(name);
		}
		setDeleteOrder();
	};
	setDeleteOrder();

	return defer.promise;
};

/**
 * @desc
 * Creates a new catalog if catalog id is not specified.
 * @returns {Promise}
 * @param {catalog}
 */
var createCatalog = function(catalog) {
	var defer = Q.defer();
	var isNew = true;
	var acls = config.catalog.acls;
	var hasValidACLs = (typeof acls === "object") && (acls.constructor === Object)  && Object.keys(acls).length !== 0;

	if (!catalog) {
		defer.resolve();
	} else if (catalog.id && !config.catalog.acls) {
		console.log("Catalog with id " + catalog.id + " already exists.");
		defer.resolve();
	} else {
		if (catalog.id) isNew = false;
		catalog.create().then(function() {

			if (isNew) console.log("Catalog created with id " + catalog.id);
			else console.log("Catalog with id " + catalog.id + " already exists.");

			if (hasValidACLs) {
				console.log("Updating catalog ACLs...");
				return catalog.addACLs(acls);
			}
			defer.resolve();
		}).then(function() {
			if (hasValidACLs) {
				console.log("ACLS added: " + JSON.stringify(acls));
			}
			defer.resolve();
		}, function(err) {
			defer.reject(err);
		});
	}

	return defer.promise;
};

/**
 * @desc
 * Creates a new schema for a catalog if createNew is true.
 * @returns {Promise}
 * @param {schema}
 */
var createSchema = function(schema) {
	var defer = Q.defer();
	if (!schema) {
		defer.resolve();
	} else if (config.schema.createNew) {
		schema.create().then(function() {
			console.log("Schema created with name " + schema.name);
			defer.resolve();
		}, function(err) {
			defer.reject(err);
		});
	} else {
		defer.resolve();
	}

	return defer.promise;
};


/**
 * @desc
 * Creates tables for specified schema and catalog and then calls createForeignKeys and importEntities to import data.
 * @returns {Promise} Returns a promise.
 * @param {Schema} An object of Schema
 */
var createTables = function(schema) {
	var defer = Q.defer();

	if (!schema) {
		defer.resolve();
	} else {

		var promises = [], tables = {}, tableNames = [], index = 0, tableDocs = [], tableDoc;

		// Populate tables from their json on basis of schema tables field and then create them
		for (var k in schema.content.tables) {
			var table = new Table({
				url: config.url,
				schema: schema,
				table: schema.content.tables[k]
			});
			tables[k] = table;
			tableNames.push(k);

      // gather the table documents for creation
			if (config.tables.createNew == true && (!schema.content.tables[k].exists || (config.tables.newTables.indexOf(k) != -1))) {
        if (!table.catalog.id || !table.schema.name || !table.name) {
          return defer.reject("No catalog or schema set : create table function"), defer.promise;
        }
        tableDocs.push(table.content);
      }
		}

    var url = schema.url + '/catalog/' + schema.catalog.id + "/schema/";
    http.post(url, tableDocs).then(function () {
			console.log("Tables created for schema " + schema.name);
			schema.tables = tables;
			// Import data for following tables in order for managing foreign key management
			return importEntities(tableNames, tables, schema);
		}).then(function() {
			console.log("Data imported");
			// Add foreign keys in the table
			return createForeignKeys(schema);
		}).then(function() {
			console.log("Foreign Keys created");
			defer.resolve();
		}, function(err) {
			defer.reject(err);
		});
	}

	return defer.promise;
};

/**
 * @desc
 * Calls insertEntitiesForATable for each passed in tables to import entities in the order specified in schema.
 * @returns {Promise} Returns a promise.
 * @param {tables} An array of Table Objects.
 */
var importEntities = function(tableNames, tables, schema) {
	var defer = Q.defer(), index = -1, importedTables = [];
	delete require.cache[require.resolve(process.env.PWD + "/" + (config.schema.path || ('./schema/' + config.schemaName  + '.json')))];

	if (config.entities && config.entities.createNew) {
		console.log("Inside import entities");
		var cb = function() {
			if (tableNames.length == 0) return defer.resolve();
			var name = tableNames.shift();
			var table = tables[name];
			if (!table.exists || config.entities.newTables.indexOf(name) != -1) {
				var table = tables[name];
				insertEntitiesForATable(table, schema.name, config.entities.path).then(function() {
					importedTables.push(name);
					cb();
				}, function(err) {
					console.log(err);
					defer.reject(err);
				});
			} else {
				importedTables.push(name);
				cb();
			}
		};

		cb();
	} else {
		defer.resolve();
	}

	return defer.promise;
};

/**
 * @desc
 * Insert entities for passed in table reading them from a json file with the same name in data folder.
 * @returns {Promise} Returns a promise.
 * @param {table} A Table Object.
 */
var insertEntitiesForATable = function(table, schemaName, entitiesPath) {
	var defer = Q.defer();

	var datasets = new Entites({
		url: config.url,
		table: table
	});
	datasets.create({
		entities: require(process.env.PWD + "/" + (entitiesPath + "/" + table.name + '.json'))
	}).then(function(entities) {
		console.log(entities.length + " Entities of type " + table.name.toLowerCase() + " created");
		table.entities = entities;
		defer.resolve();
	}, function(err) {
		defer.reject(err);
	});

	return defer.promise;
};

/**
 * @desc
 * Creates all the foreignkeys specified in the schema
 * @returns {Promise} Returns a promise.
 * @param {tables} table Objects.
 */
var createForeignKeys = function(schema) {
	var defer = Q.defer();

  if (config.tables.createNew !== true) {
    defer.resolve();
    return defer.promise;
  }

  var fks = [], table;
  for (var tableName in schema.tables) {
    if (!schema.tables.hasOwnProperty(tableName)) continue;
    table = schema.tables[tableName];

    // if table is not new or doesn't have any foreignkeys don't bother
    if (!table.foreignKeys) continue;

    // NOTE exists and newTables are not documented anywhere
    if (schema.content.tables[tableName].exists && (config.tables.newTables && config.tables.newTables.indexOf(tableName) === -1)) {
      continue;
    }

    fks.push(...table.foreignKeys);
  }

  if (fks.length === 0) {
    defer.resolve();
  }

  var url = schema.url + '/catalog/' + schema.catalog.id + "/schema/";
  http.post(url, fks).then(function (response) {
    console.log("Foreignkeys created for schema " + schema.name);
    defer.resolve();
  }, function (err) {
    console.log(err);
    defer.reject(err);
  });

  return defer.promise;
};


exports.createSchemasAndEntities = function (settings) {
  /**
  * {
  *  url
  *  authCookie
  *  catalog: {} // if you want to test on existsing schema provide `id`, it could have `acls`
  *  schemas: [
  *    {path: "", entities: ""}
  *  ]
  * }
  */
  var defer = Q.defer();

  var error = "";
  if (typeof settings.authCookie !== "string" && !settings.authCookie) {
    error = "authCookie is missing.";
  } else if (!settings.setup) {
    error = "setup is missing.";
  } else if (!settings.setup.catalog) {
    error = "setup.catalog is missing.";
  }

  if (error) {
    return defer.reject(error), defer.promise;
  }

  config = settings.setup;
  config.url = settings.url || 'https://dev.isrd.isi.edu/ermrest';

  http.setDefaults({
    headers: { 'Cookie': settings.authCookie || "a=b;" },
    json: true,
    _retriable_error_codes : [0,500,503]
  });

  // if catalogId exists, we won't create a new catalog.
  var catalog = new Catalog({
    url: config.url,
    id: config.catalog.id
  });

  console.log("authCookie: ", settings.authCookie);
  http.get(config.url.replace('ermrest', 'authn') + "/session").then(function(response) {
    console.log("Valid session found.");
    // create catalog or use the existing
    return createCatalog(catalog);
  }).then(function () {
    // append all schemas together and send a request to create them
    return createSchemas(catalog);
  }).then(function () {
    return importCatalogEntities(catalog);
  }).then(function () {
    return createCatalogForeignKeys(catalog);
  }).then(function () {
    if (config.schemas) {
      defer.resolve({schemas: catalog.schemas, catalogId: catalog.id});
    } else {
      defer.resolve({catalogId: catalog.id});
    }
  }).catch(function (err) {
    console.log("catch error!");
    console.log(err);
    defer.reject(err);
  });

  return defer.promise;
};


function createSchemas(catalog) {
  var defer = Q.defer();

  if (!config.schemas) {
      return defer.resolve(), defer.promise;
  }

  catalog.schemas = {};
  var schemaDocs = [], schema, table;
  for(var schemaName in config.schemas) {
    if (!config.schemas.hasOwnProperty(schemaName)) continue;

    schema = new Schema({
      url: config.url,
      catalog: catalog,
      schema: require(process.env.PWD + "/" + config.schemas[schemaName].path)
    });

    if (schemaName != schema.name) {
      return defer.reject("given schema name (" + schemaName + ") in configuraion is not the same as schema_name."), defer.promise;
    }

    // create table objects in the schema (this removes foreignkey content)
    schema.tables = {};
    for (var k in schema.content.tables) {
      if (!schema.content.tables.hasOwnProperty(k)) continue;

		  table = new Table({
				url: config.url,
				schema: schema,
				table: schema.content.tables[k]
			});

      schema.tables[table.name] = table;
    }

    // add the schema to list
    schemaDocs.push(schema.content);

    // update catalog.schemas
    catalog.schemas[schema.name] = schema;
  }

  var url = schema.url + '/catalog/' + schema.catalog.id + "/schema/";
  // TODO this can be in form of {'schemas': {'schemaname': {}}}
  http.post(url, schemaDocs).then(function () {
    console.log("Created the following schemas: " + schemaDocs.map(function (s) {return s.schema_name;}).join(", "));
    defer.resolve();
  }).catch(function (err) {
    defer.reject(err);
  });

  return defer.promise;
}


function importCatalogEntities(catalog) {
  var defer = Q.defer();

  if (!config.schemas) {
      return defer.resolve(), defer.promise;
  }

  var promises = [], schema, table;
  for (var schemaName in catalog.schemas) {
    if (!catalog.schemas.hasOwnProperty(schemaName)) continue;

    schema = catalog.schemas[schemaName];
    for (var tableName in schema.tables) {
      if (!schema.tables.hasOwnProperty(tableName)) continue;
      if (!config.schemas[schemaName].entities) continue;

      promises.push(insertEntitiesForATable(schema.tables[tableName], schemaName, config.schemas[schemaName].entities));
    }
  }

  if (promises.length === 0) {
    return defer.resolve(), defer.promise;
  }

  Q.all(promises).then(function () {
    defer.resolve();
  }).catch(function (err) {
    defer.reject(err);
  });

  return defer.promise;
}

function createCatalogForeignKeys(catalog) {
  var defer = Q.defer();

  if (!config.schemas) {
      return defer.resolve(), defer.promise;
  }

  var fks = [], schema, table;
  for (var schemaName in catalog.schemas) {
    if (!catalog.schemas.hasOwnProperty(schemaName)) continue;

    schema = catalog.schemas[schemaName];
    for (var tableName in schema.tables) {
      if (!schema.tables.hasOwnProperty(tableName)) continue;

      table = schema.tables[tableName];
      if (!table.foreignKeys) continue;
      fks.push(...table.foreignKeys);
    }
  }

  var url = schema.url + '/catalog/' + schema.catalog.id + "/schema/";
  http.post(url, fks).then(function (response) {
    console.log(fks.length + " foreignkeys created for the given schemas.");
    defer.resolve();
  }).catch(function (err) {
    defer.reject(err);
  });

  return defer.promise;
}
