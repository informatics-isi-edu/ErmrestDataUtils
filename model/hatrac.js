var http = require('axios');

class Hatrac {
  constructor(options) {
    // namespacePath should end with '/'
    this.namespace = options.namespace;
  }
  
  deleteFile(file) {
    return new Promise((resolve, reject) => {
      if (typeof file !== 'string') return resolve("'File' is not a string");

      http.delete(this.namespace + file).then((response) => {
        resolve();
      }, (err) => {
        reject(err);
      });
    });
  }
}

module.exports = Hatrac;