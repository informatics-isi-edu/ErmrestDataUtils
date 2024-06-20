var http = require('axios');

class Hatrac {
  constructor(options) {
    // namespacePath should end with '/'
    this.namespace = options.namespace;
  }
  
  deleteVersion(file, version) {
    return new Promise((resolve, reject) => {
      if (typeof file !== 'string' || !file) return reject("'File' is not a string or is undefined");
      if (typeof version !== 'string' || !version) return reject("'Version' is not a string or is undefined");

      http.delete(`${this.namespace}${file}:${version}`).then((response) => {
        resolve();
      }, (err) => {
        reject(err);
      });
    });
  }
}

module.exports = Hatrac;