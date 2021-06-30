var dataUtils = require('./../import.js');
var Catalog = require('./../model/catalog.js');

var configuration = {
    setup: {
        "catalog": {},
        "schema": {
            "name": "faceting",
            "createNew": true,
            "path": "schema/faceting.json"
        },
        "tables": {
            "createNew": true
        },
        "entities": {
            "createNew": true,
            "path": "data/faceting"
        }
    },
    url: process.env.ERMREST_URL,
    authCookie: process.env.AUTH_COOKIE,
    cleanup: false
};

dataUtils.importData(configuration).then(function(data) {
    console.log("Data imported with catalogId " + data.catalogId);
    console.log("Please remember to clean up the catalog.");

    var acls = {
        "select": [
            "https://auth.globus.org/eae2035c-01d0-11e6-a311-c78c6eaeef83", // jchudy test
            "https://auth.globus.org/176baec4-ed26-11e5-8e88-22000ab4b42b"  // Anyone in "isrd-staff" can read ACL
        ],
        "write": [
            "https://auth.globus.org/eae2035c-01d0-11e6-a311-c78c6eaeef83", // jchudy test
            "https://auth.globus.org/176baec4-ed26-11e5-8e88-22000ab4b42b"  // Anyone in "isrd-staff" can write ACL
        ]
    };

    // Anyone in "isrd-staff" can read ACL
    return Catalog.addACLs(data.schema.url, data.catalogId, acls);
    // Anyone can read ACL
    // return Catalog.addACLs(data.schema.url, data.catalogId, {"select": ["*"]});
}, function(err) {
    console.log("Unable to import data");
    console.dir(err);
}).then(function(data) {
    console.log("ACLs set");
}, function(err) {
    console.log("Unable to set ACLs");
    console.dir(err);
});
