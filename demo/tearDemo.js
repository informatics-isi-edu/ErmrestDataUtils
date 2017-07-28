// Pass the catalog number to arguments.
// sample usage: node tearDemo.js 30461

var dataExport = require('./../import.js');
var args = process.argv;

if (args.length != 3) {
    console.error("You have to pass the catalog number.\nsample usage: node tearDemo.js 30461");
    return;
}

var configuration = {
    setup: {
        "catalog": {}
    },
    url: process.env.ERMREST_URL,
    authCookie: process.env.AUTH_COOKIE,
    catalogId: args[2], // TODO change this number
};

dataExport.tear(configuration).then(function(data) {
    console.log("Deleted the catalog.");
}, function(err) {
    console.err("Unable to delete catalog");
    console.dir(err);
});
