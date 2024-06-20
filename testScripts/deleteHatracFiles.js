var hatracUtils = require('./../hatrac.js');

var configuration = {
  authCookie: process.env.AUTH_COOKIE,
  namespacePath: 'https://dev.derivacloud.org/hatrac/js/chaise/test/'
};

configuration.file = 'file%204.txt';
configuration.version = '';
hatracUtils.deleteFileVersion(configuration).then(() => {
  console.log("version delete");
}, (err) => {
  console.log("Unable to delete version");
  console.dir(err);
});