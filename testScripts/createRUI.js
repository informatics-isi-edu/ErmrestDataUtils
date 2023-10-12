var dataUtils = require('../import.js');

const configuration = {
  setup: {
    "catalog": {
      "acls": {
        "enumerate": ["*"]
      }
    },
    "schemas": {
      "rui": {
        "path": "schema/rui.json"
      }
    }
  },
  url: process.env.ERMREST_URL,
  authCookie: process.env.AUTH_COOKIE
};

const createCatalog = () => {
  console.log(`server ${configuration.url} with cookie ${configuration.authCookie}`);
  let catalogId;
  dataUtils.createSchemasAndEntities(configuration).then(function (data) {
    catalogId = data.catalogId;
    console.log(`Data imported with catalogId ${catalogId}`);
    console.log("Please remember to clean up the catalog.");

    importAcls(catalogId);
  }).catch((err) => {
    console.log("Unable to import data");
    console.dir(err);
  });
}


var importAcls = function (catalogId) {
  var config = {
    setup: {
      "catalog": {
        "id": catalogId,
        "acls": {
          "enumerate": ["*"], // everybody can read!
          "select": ["*"],
          "write": [
            "https://auth.globus.org/9d596ac6-22b9-11e6-b519-22000aef184d" //isrd-testers
          ],
        }
      }
    },
    url: process.env.ERMREST_URL,
    authCookie: process.env.AUTH_COOKIE
  };

  dataUtils.importACLS(config).then(function () {
    console.log("Acls imported with catalogId " + catalogId);
    console.log("Please remember to clean up the catalog.");
    process.exit(0);
  }, function (err) {
    console.log("Unable to import acls");
    console.dir(err);
    process.exit(1);
  });

};


createCatalog()
// importAcls(78976);
