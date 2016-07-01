## Data Import, Export and Cleanup Tool

The data import and export utility allows to create new catalog, schemas, tables and entities as well as export them.

### Import

To import data you need to provide a configuration that specifies the content to be created, Ermrest API Url and AuthCookie. This could be declared like this

```javascript
var configuration = {
	setup : {
	{
	    "catalog": {
	        //"id": 1  //existing id of a catalog
	    },
	    "schema": {
	        "name": "product",
	        "createNew": true, // change this to false to avoid creating new schema
	        "path": "schema/product.json" // path of the schema json file in the current working directory folder
	    },
	    "tables": {
	        "createNew": true, // Mention this to be true to allow creating new tables
	    },
	    "entities": {
	        "createNew": true, // Mention this to be true to allow creating new entities
	        "path": "data/product", // This is the path from where the json for the entities will be picked for import
	    },

	},
	url: "https://dev.isrd.isi.edu/ermrest/",  //Ermrest API url
	authCookie: "ermrest_cookie;" // Ermrest Authentication cookie to create data
}
```

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

### Export

To export an existing catalog and its default schema you can use the `download` function. It will download the schema information and entities and save it in the folder that you provide.

```javascript
var ermrestUtils = require('ermrest-data-utils');
ermrestUtils.download({
	catalogId: 1,          // Mandatory
	url: "https://dev.isrd.isi.edu/ermrest/", // Ermrest API Url from where you want to download data
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

