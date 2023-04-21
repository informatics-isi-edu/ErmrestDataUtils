var dataUtils = require('../import.js');

const configuration = {
  setup: {
    "catalog": {
      "acls": {
        "enumerate": ["*"]
      }
    },
    "schemas": {
      "favorites": {
        "path": "schema/favorites.json",
        "entities": "data/favorites"
      }
    }
  },
  url: process.env.ERMREST_URL,
  authCookie: process.env.AUTH_COOKIE
};

const createCatalog = () => {
  let catalogId;
  dataUtils.createSchemasAndEntities(configuration).then(function (data) {
    catalogId = data.catalogId;
    console.log(`Data imported with catalogId ${catalogId}`);
    console.log("Please remember to clean up the catalog.");

    // since the favorites annotation has the catalog number, we have to manually add it
    const uri = `${configuration.url}/catalog/${catalogId}/schema/favorites/table/table_w_favorites/annotation`;
    const annot = {
      "tag:isrd.isi.edu,2021:table-config": {
        "user_favorites": {
          "storage_table": {
            "catalog": catalogId,
            "schema": "favorites",
            "table": "stored_favorites"
          }
        },
        "stable_key_columns": ["id"]
      }
    }
    return dataUtils.http.put(uri, annot);
  }).then(() => {
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
          "write": ["https://auth.globus.org/176baec4-ed26-11e5-8e88-22000ab4b42b"], //isrd-staff
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