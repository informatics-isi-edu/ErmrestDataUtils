var configuration = {
    setup: {
        "catalog": { acls: [{ name: "content_write_user", user: "*"}, { name: "write_user", user : "*" }] },
        "schema": {
            "name": "reference",   
            "createNew": true,  
            "path": "schema/myschema.json"  
        },
        "tables": {
            "createNew": true
        },
        "entities": {
            "createNew": true,
            "path": "data/product/"  
        }
    },
    url: "https://dev.isrd.isi.edu/ermrest",
    authCookie: process.env.AUTH_COOKIE
};

var dataImport = require('./import.js'), catalogId; 

dataImport.importData(configuration).then(function(data) {
    console.log("Data imported with catalogId " + data.catalogId);
    configuration.catalogId = catalogId = data.catalogId;
    //return dataImport.tear(configuration);
}).then(function() {
    console.log("Cleanup Done");
}, function(err) {
    if(!catalogId) console.log("Unable to import data");
    else console.log("unable to delete catalog with id " + catalogId);
    console.dir(err);
});
