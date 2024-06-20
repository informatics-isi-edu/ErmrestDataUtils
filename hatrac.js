const http = require('axios');
var Q = require('q');

var Hatrac = require('./model/hatrac.js');

exports.deleteFileVersion = (options) => {
  var defer = Q.defer();

  var config = options;
  config.authCookie = config.authCookie;

  // set the cookie for all the requests
  http.defaults.withCredentials = true;
  http.defaults.headers.common.Cookie = config.authCookie || '';

  var hatrac = new Hatrac({
		namespace: config.namespacePath
	});

  hatrac.deleteVersion(config.file, config.version).then(() => {
    defer.resolve();
  }, (err) => {
    console.dir(err);
    defer.reject(err);
  });

  return defer.promise;
}