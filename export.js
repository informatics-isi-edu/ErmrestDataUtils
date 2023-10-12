
const axios = require('axios');
const fs = require('fs');
var dataSetupCode =  require('./import.js');

exports.download = function (options) {

  var ermrestURL = options.url ||  "https://dev.derivacloud.org/ermrest";
  var authCookie = options.authCookie || "";
  var catalogId = options.catalogId || 1;

  // Fetches the schemas for the catalogId
  // and returns the defaultSchema and the catalog
  dataSetupCode.introspect({
    url: ermrestURL,
    catalogId: catalogId,
    authCookie: authCookie
  }).then(function(schema) {

    if (options.schemaName) schema = schema.catalog.schemas[options.schemaName] || schema;

    console.log(process.env.PWD + (options.folderName ? ( "/" + options.folderName) : "") + '/schema');

    if (options.folderName) {
      if (!fs.existsSync(process.env.PWD + (options.folderName ? ( "/" + options.folderName) : "/") )) {
          fs.mkdirSync(process.env.PWD + (options.folderName ? ( "/" + options.folderName) : "/"));
      }
    }

    // Write the schema to the file with schema name under schema folder
    fs.writeFile(process.env.PWD + (options.folderName ? ( "/" + options.folderName) : "") + "/"  + schema.name + ".json", JSON.stringify(schema.content, undefined, 2) , function(err) {
      if (err) throw err;

      // set the cookie for all the requests
      axios.defaults.withCredentials = true;
      axios.defaults.headers.common.Cookie = authCookie || '';

      console.log(schema.name);

      exportEntities = async function(table) {
        // Fetch entities for the table and save them in the file with tableName under the schemaName folder inside data folder
        try {
          const { data } = await axios.get(
            ermrestURL + '/catalog/' + catalogId + '/entity/' + schema.name + ':' + table,
            { responseType: 'stream' }
          );
          data.pipe(fs.createWriteStream(process.env.PWD + (options.folderName ? ( "/" + options.folderName) : "") + '/data/' + table + '.json'));
          console.log(table);
        } catch (error) {
          console.log(`unable to save data for table: ${table}`);
          console.oog(error);
        }
      };

      if (!fs.existsSync(process.env.PWD + (options.folderName ? ( "/" + options.folderName) : "") + '/data')) {
        fs.mkdirSync(process.env.PWD + (options.folderName ? ( "/" + options.folderName) : "") + '/data');
      }

      if (!fs.existsSync(process.env.PWD + (options.folderName ? ( "/" + options.folderName) : "") + '/data')){
        fs.mkdirSync(process.env.PWD + (options.folderName ? ( "/" + options.folderName) : "") + '/data');
      }

      // Export all entities for all tables in the schema
      for(var k  in schema.content.tables) {
        exportEntities(k);
      }

    });


  }, function(err) {
    throw new Error("Unable to fetch schemas");
  });

};









