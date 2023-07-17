/**
 * Use this script to test the static and dymaic acl support
 * to test this, you need two users.
 * one that is more priviliged and will create this catalog, and another user
 * without any special priviledge that can only see subset of data/model.
 */

const dataUtils = require('../import.js');

const configuration = {
  setup: {
    "catalog": {
      "acls": {
        "enumerate": ["*"]
      }
    },
    "schemas": {
      "multi-permissions": {
        "path": "schema/multi-permissions.json",
        "entities": "data/multi-permissions"
      }
    }
  },
  url: 'https://dev.isrd.isi.edu/ermrest',
  authCookie: process.env.AUTH_COOKIE
};

const ACLConfig = {
    "acls": {
      "enumerate": ["*"], // everybody can read!
      "select": ["*"],
      "write": [
        "https://auth.globus.org/9d596ac6-22b9-11e6-b519-22000aef184d" //isrd-testers
      ],
    },
    "schemas": {
      "multi-permissions": {
        "tables": {
          "dynamic_acl_main_table": {
            "acl_bindings": {
              // row 1, 3, 5, 6 can be deleted
              "deletable_rows": {
                "types": ["delete"],
                "projection": [
                  {
                    "or": [
                      { "filter": "id", "operand": 1 },
                      { "filter": "id", "operand": 3 },
                      { "filter": "id", "operand": 5 },
                      { "filter": "id", "operand": 6 }
                    ]
                  },
                  "id"
                ],
                "projection_type": "nonnull"
              },
              // row 1, 4, 5, 6 can be updated
              "updatable_rows": {
                "types": ["update"],
                "projection": [
                  {
                    "or": [
                      { "filter": "id", "operand": 1 },
                      { "filter": "id", "operand": 4 },
                      { "filter": "id", "operand": 5 },
                      { "filter": "id", "operand": 6 },
                    ]
                  },
                  "id"
                ],
                "projection_type": "nonnull"
              }
            },
            "columns": {
              // id is generated
              "name": {
                "acl_bindings": {
                  "updatable_rows": false,
                  "updatable_cols": {
                    "types": ["update"],
                    "projection": [
                      { "filter": "id", "operand": 5, "negate": true },
                      { "filter": "id", "operand": 6, "negate": true },
                      "id"
                    ],
                    "projection_type": "nonnull"
                  }
                }
              },
              "fk_col": {
                "acl_bindings": {
                  "updatable_rows": false,
                  "updatable_cols": {
                    "types": ["update"],
                    "projection": [
                      { "filter": "id", "operand": 5, "negate": true },
                      "id"
                    ],
                    "projection_type": "nonnull"
                  }
                }
              }
            }
          },
          "dynamic_acl_related_table": {
            "acl_bindings": {
              // row 1, 3 can be deleted
              "deletable_rows": {
                "types": ["delete"],
                "projection": [
                  {
                    "or": [
                      { "filter": "id", "operand": 1 },
                      { "filter": "id", "operand": 3 }
                    ]
                  },
                  "id"
                ],
                "projection_type": "nonnull"
              },
              // row 1, 4 can be deleted
              "updatable_rows": {
                "types": ["update"],
                "projection": [
                  {
                    "or": [
                      { "filter": "id", "operand": 1 },
                      { "filter": "id", "operand": 4 }
                    ]
                  },
                  "id"
                ],
                "projection_type": "nonnull"
              }
            }
          },
          "dynamic_acl_assoc_table": {
            "acl_bindings": {
              // association (1,2) can be deleted
              "deletable_rows": {
                "types": ["delete"],
                "projection": [
                  { "filter": "id_1", "operand": 1 },
                  { "filter": "id_2", "operand": 2 },
                  "id_1"
                ],
                "projection_type": "nonnull"
              }
            }
          },
          "dynamic_acl_related_assoc_table": {
            "acl_bindings": {
              // related 1 can be deleted
              "deletable_rows": {
                "types": ["delete"],
                "projection": [
                  { "filter": "id", "operand": 1 },
                  "id"
                ],
                "projection_type": "nonnull"
              },
              // related 1 can be updated
              "updatable_rows": {
                "types": ["update"],
                "projection": [
                  { "filter": "id", "operand": 1 },
                  "id"
                ],
                "projection_type": "nonnull"
              }
            }
          }
        }
      }
    }
}

const createCatalog = () => {
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
      catalog: {
        id: catalogId,
        ...ACLConfig
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


createCatalog();