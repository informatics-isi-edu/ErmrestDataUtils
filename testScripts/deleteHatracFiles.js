var hatracUtils = require('./../hatrac.js');

var configuration = {
  authCookie: process.env.AUTH_COOKIE,
  namespacePath: 'https://dev.derivacloud.org/hatrac/js/chaise/test/'
};

// use `/hatrac/path/to/namespace/file;versions` to see the versions to delete
// any other versions that might exist in folder that aren't reported by hatrac are already orphaned or incomplete uploads
//    so it should be safe to navigate to those in terminal and use `rm` to delete them

configuration.file = 'file%204.txt';
configuration.version = '5QEZVUPCFU2ACV5R3D2IY3RZ7A';
hatracUtils.deleteFileVersion(configuration).then(() => {
  console.log("version delete");
}, (err) => {
  console.log("Unable to delete version");
  console.dir(err);
});