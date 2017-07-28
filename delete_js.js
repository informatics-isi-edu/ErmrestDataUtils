var configuration = {
    setup: {
        "catalog": { acls: [{ name: "content_write_user", user: "*"}, { name: "write_user", user : "*" }] },
        "schema": {
            "name": "schema",
            "createNew": true,
            "path": "schema/test.json"
        },
        "tables": {
            "createNew": true
        },
        "entities": {
            "createNew": true,
            "path": "data/schema"
        }
    },
    "catalogId": 30459,
    url: "https://dev.isrd.isi.edu/ermrest",
    authCookie: process.env.AUTH_COOKIE
};
//TODO tear the catalogs after adding them.
var dataTear = require('./import.js'), catalogId;
dataTear.tear(configuration).then(function(data) {
    console.log("Data cleanedup");
}, function(err) {
    console.log("Unable to cleanup data");
    console.dir(err);
});
