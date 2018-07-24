var dataUtils = require('./../import.js');

var configuration = {
    setup: {
        "catalog": {
            "acls": {
              "enumerate": ["*"]
            }
        },
        "schemas": {
          "product": {
            "path": "demo/schema/product.json",
            "entities": "demo/data/product"
          }
        }
    },
    url: process.env.ERMREST_URL,
    authCookie: process.env.AUTH_COOKIE
};

dataUtils.createSchemasAndEntities(configuration).then(function(data) {
    console.log("Data imported with catalogId " + data.catalogId);
    console.log("Please remember to clean up the catalog.");
    importAcls(data.catalogId);
}, function(err) {
    console.log("Unable to import data");
    console.dir(err);
});


var importAcls = function(catalogId) {
    var config = {
        setup: {
            "catalog": {
                "id": catalogId,
                "acls": {
                    "enumerate": ["*"] // everybody can read!
                },
                "schemas": {
                    "product": {
                        "acls": {
                            "enumerate": ["*"]
                        },
                        "tables": {
                            "accommodation": {
                                "acls": {
                                    "select": ["userid1", "userid2"]
                                },
                                "columns": {
                                    "id": {
                                        "acls": {
                                            "select": []
                                        }
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
        },
        url: process.env.ERMREST_URL,
        authCookie: process.env.AUTH_COOKIE
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

};
