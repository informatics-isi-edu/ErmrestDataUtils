var dataUtils = require('./import.js');

var configuration = {
    setup: {
        "catalog": {
            "acls": {
                "write": ["*"] // everybody can write!
            }
        },
        "schema": {
            "name": "product",
            "createNew": true,
        //   "path": "../chaise/test/e2e/data_setup/schema/record/product.json" 
           "path":"./schema/test1.json"
        },
        "tables": {
            "createNew": true
        },
        "entities": {
            "createNew": true,
          //   "path":"../chaise/test/e2e/data_setup/data/product"
               "path":"./data/schema"
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
