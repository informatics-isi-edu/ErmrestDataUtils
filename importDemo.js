var dataUtils = require('./import.js');

var configuration = {
    setup: {
        "catalog": {
            "acls": {
                "write": ["https://auth.globus.org/12c4fb8b-1254-49ec-ab77-2f4b471a3bc0"], // everybody can write!,
                "select": ["*"]
            }
        },
        "schema": {
            "name": "multiadd",
            "createNew": true,
        //  "path": "../chaise/test/e2e/data_setup/schema/record/product.json" 
          "path":"./schema/multiadd.json"
          // "path":"../ermrestjs/test/specs/annotation/conf/table_display/schema.json"
        },
        "tables": {
            "createNew": true
        },
        "entities": {
            "createNew": true,
            //  "path":"../chaise/test/e2e/data_setup/data/product"
            //   "path":"../ermrestjs/test/specs/annotation/conf/table_display/data"
			"path": "./data/multiadd"
        }
    },
    url: process.env.ERMREST_URL,
    authCookie: process.env.AUTH_COOKIE    
};

dataUtils.importData(configuration).then(function(data) {
    console.log("Data imported with catalogId " + data.catalogId);
    console.log("Please remember to clean up the catalog.");
}, function(err) {
    console.log("Unable to import data");
    console.dir(err);
});