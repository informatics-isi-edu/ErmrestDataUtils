var dataUtils = require('./../import.js');

var configuration = {
    setup: {
        "catalog": {
            "acls": {
                "write": ["*"] // everybody can write!
            }
        }
    },
    url: process.env.ERMREST_URL,
    authCookie: process.env.AUTH_COOKIE,
    cleanup: false
};

dataUtils.importData(configuration).then(function(data) {
    console.log("Data imported with catalogId " + data.catalogId);
    console.log("Please remember to clean up the catalog.");
}, function(err) {
    console.log("Unable to import data");
    console.dir(err);
});
