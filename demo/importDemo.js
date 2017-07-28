var dataUtils = require('./../import.js');

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
            "path": "schema/product.json"  
        },
        "tables": {
            "createNew": true
        },
        "entities": {
            "createNew": true,
            "path": "data/product"  
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
