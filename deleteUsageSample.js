var configuration = {
    setup: {
        "catalog": {
            "id": "29732"
        },
        "schema": {
            "name": "product",   
            "createNew": true,  
            "path": "schema/myschema.json"  
        },
        "tables": {
            "createNew": true
        },
        "entities": {
            "createNew": true,
            "path": "data/product"  
        },
        
    },
    "catalogId": "29732",
    cleanup: true,
    url: "https://dev.isrd.isi.edu/ermrest",
    authCookie: process.env.AUTH_COOKIE
};

var ermrestUtils = require('./import.js');
ermrestUtils.tear(configuration).then(function(data) {
	console.log("Data cleanedup");
}, function(err) {
	console.log("Unable to cleanup data");
	console.dir(err);
});
