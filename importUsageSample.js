var configuration = {
	configuration: {
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
	url: "https://dev.isrd.isi.edu/ermrest/",
	authCookie: "ermrest=C6KFIQn2JS37CGovofWnjKfu;"
};

var dataImport = require('./import.js');

dataImport.importData(configuration).then(function(data) {
	console.log("Data imported with catalogId " + data.catalogId);
}, function(err) {
	console.log("Unable to import data");
	console.dir(err);
});
