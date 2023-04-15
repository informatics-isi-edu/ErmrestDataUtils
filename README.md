## Data Import, Export and Cleanup Tool

The data import and export utility allows to create new catalog, schemas, tables and entities as well as export them.

## Getting Started

To work with this piece of code, `npm clean-install` should be run to install the dependencies specified in `package.json`.

### Import

To import data you need to provide a configuration that specifies the content to be created, Ermrest API Url and AuthCookie. This could be declared like this

```javascript
var configuration = {
	setup : {
	{
	    "catalog": { // required
	        //"id": 1  //existing id of a catalog
	        //"acls": {}
	    },
	    "schema": { // required
	        "name": "product",
	        "createNew": true, // change this to false to avoid creating new schema
	        "path": "schema/product.json" // path of the schema json file in the current working directory folder
	    },
	    "tables": { // required
	        "createNew": true, // Mention this to be true to allow creating new tables
	    },
	    "entities": { // optional
	        "createNew": true, // Mention this to be true to allow creating new entities
	        "path": "data/product", // This is the path from where the json for the entities will be picked for import
	    },

	},
	url: "https://dev.isrd.isi.edu/ermrest",  //Ermrest API url
	authCookie: "ermrest_cookie;", // Ermrest Authentication cookie to create data
	cleanup: true
}
```

> As you can see you can update catalog ACLs by passing them in the configuration. Take a look at [ermrest documentation](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/acls.md#available-static-acl-names) for ACL syntax. If you want everyone to be able to see your data use `{ "select": ["*"] }` as the value for the `acls`.

Once you've your configuration you just need to call the `importData` function in your script. Here's how your code would look like if you have already declared the configuration variable mentioned above.

```javascript
var ermrestUtils = require('ermrest-data-utils');
ermrestUtils.importData(configuration).then(function(data) {
	console.log("Data imported with catalogId " + data.catalogId);
}, function(err) {
	console.log("Unable to import data");
	console.dir(err);
});
```

### Import Multiple Schemas
If you want to create multiple schemas at once, you can use the following method with the given configuration structure.

```javascript
var configuration = {
  setup: { // required
    "catalog": { // (optional)
      "id": "existing catalog id", // pass this if you want to use an existing catalog
      "acls": {} // pas the list of acls that you want to add for the catalog
    },
    "schemas": { // list all the schemas that you want to create here
      "schema name 1": {
        "path": "path to the schema document file",
        "entities": "the folder path from where the json for the entities will be picked for import"
      },
      ...
    }
  },
  url: "ermrest url", //required
  authCookie: "webauthn cookie" //required
};

var ermrestUtils = require('@isrd-isi-edu/ermrest-data-utils');
ermrestUtils.createSchemasAndEntities(configuration).then(function(data) {
	console.log("Data imported with catalogId " + data.catalogId);
}, function(err) {
	console.log("Unable to import data");
	console.dir(err);
});

```

### Import ACLs explicitly

To import ACLs explicitly you can call the `importACLs` method and pass a configuration object. This would allow you to pass both static and dynamic ACLs. The following is an example of using this API:

```js
var dataUtils = require('@isrd-isi-edu/ermrest-data-utils');

var config = {
	url: "https://dev.isrd.isi.edu/ermrest",  //Ermrest API url
	authCookie: "ermrest_cookie;", // Ermrest Authentication cookie to create data
	"catalog": {
        "id": catalogId,
        "acls": {
            "enumerate": ["*",] // everybody can read!
        },
        "schemas": {
            "product": {
                "acls": {
                    "enumerate": ["*"]
                },
                "acl_bindings": {
                    "allow_delete_on_row_1": {
                        "types": ["delete"],
                        "projection": [
                            {"filter": "id", "operand": 1}, "id"
                        ],
                        "projection_type": "nonnull"
                    }
                },
                "tables": {
                    "accommodation": {
                        "acls": {
                            "select": ["userid1", "userid2"]
                        },
                        "acl_bindings": {
                            "allow_update_on_row_1": {
                                "types": ["update"],
                                "projection": [
                                    {"filter": "id", "operand": 1}, "id"
                                ],
                                "projection_type": "nonnull"
                            }
                        },
                        "columns": {
                            "id": {
                                "acls": {
                                    "select": []
                                },
                                "acl_bindings": {
                                    "allow_update_on_row_1": false,
                                    "allow_update_on_row_2": {
                                        "types": ["update"],
                                        "projection": [
                                            {"filter": "id", "operand": 2}, "id"
                                        ],
                                        "projection_type": "nonnull"
                                    }
                                },
                            },
                            "title": {
                                "acls": {
                                    "select": ["userid1"]
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

dataUtils.importACLS(config).then(function() {
    console.log("Acls imported with catalogId " + catalogId);
    console.log("Please remember to clean up the catalog.");
    process.exit(0);
}, function(err) {
    console.log("Unable to import acls");
    console.dir(err);
    process.exit(1);
});
```

You can skip acls on catalog level or schema level or table level. The acls object is not mandatory and all other nested objects(schemas, tables, columns) are optional too.


### Cleanup

To delete the stuff created by the testcases, you should call `tear` with the same configuration that you provided for import. This will delete only that data which was created by the import function and leave other stuff intact. To allow delete, you need to set cleanup as true in your configuration as mentioned above.

```javascript
var ermrestUtils = require('@isrd-isi-edu/ermrest-data-utils');
ermrestUtils.tear(configuration).then(function(data) {
	console.log("Data cleanedup");
}, function(err) {
	console.log("Unable to cleanup data");
	console.dir(err);
});

```

### Export

To export an existing catalog and its default schema you can use the `download` function. It will download the schema information and entities and save it in the folder that you provide.

```javascript
var ermrestUtils = require('@isrd-isi-edu/ermrest-data-utils');
ermrestUtils.download({
	catalogId: 1,          // Mandatory
	url: "https://dev.isrd.isi.edu/ermrest", // Ermrest API Url from where you want to download data
	authCookie: "ermrest_cookie;", // Ermrest Authentication cookie to download data
	schemaName: "legacy",   // Optional: Will download the defailt catalog if not provided
	folderName: "export01"  // Mandatory: To specify an explicit folder name where  the schema and data will be imported
}).then(function(data) {
	console.log("Data imported with catalogId " + data.catalogId);
}, function(err) {
	console.log("Unable to import data");
	console.dir(err);
});
```
