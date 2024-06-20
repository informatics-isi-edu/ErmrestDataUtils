var hatracUtils = require('./../hatrac.js');

var configuration = {
  authCookie: process.env.AUTH_COOKIE,
  namespace: 'https://dev.derivacloud.org/hatrac/js/chaise/test/'
};

configuration.file = 'file%207.txt';
hatracUtils.deleteFile(configuration).then(() => {
  console.log("version delete");
}, (err) => {
  console.log("Unable to delete version");
  console.dir(err);
});