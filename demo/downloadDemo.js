var dataUtils = require('./../import.js');

var configuration = {
	catalogId: 1,          // Mandatory
	url: process.env.ERMREST_URL, // Ermrest API Url from where you want to download data
	schemaName: "isa",   // Optional: Will download the defailt catalog if not provided
	authCookie: process.env.AUTH_COOKIE, //Optional: Ermrest cookie
	folderName: "EXPORT_FOLDER"  // Optional: To specify an explicit folder name inside the schema and data folder where the content will be
							     // exported to avoid conflicts with existing names
};

dataUtils.download(configuration);
