
const { createOrModifyCatalog } = require('../import.js');

const args = process.argv;

if (args.length != 4) {
  console.error('You have to pass the catalog number and alias.\nsample usage: node addCatalogAlias.js 30461 \'new_catalog_alias\'');
  return;
}

const configuration = {
  url: process.env.ERMREST_URL,
  id: args[2],
};

createOrModifyCatalog(configuration, process.env.AUTH_COOKIE, undefined, undefined, args[3]).then(function (data) {
  if (data) console.log(data);
}, function (err) {
  console.dir(err);
});
