var configuration = {
	setup: {
        "catalog": {},
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
	url: "https://dev.isrd.isi.edu/ermrest",
	authCookie: "ermrest_cookie"
};

var dataImport = require('./import.js'), catalogId;

dataImport.importData(configuration).then(function(data) {
	console.log("Data imported with catalogId " + data.catalogId);
    configuration.catalogId = catalogId = data.catalogId;
    return dataImport.tear(configuration);
}).then(function() {
    console.log("Cleanup Done");
}, function(err) {
	if(!catalogId) console.log("Unable to import data");
	else console.log("unable to delete catalog with id " + catalogId);
    console.dir(err);
});
