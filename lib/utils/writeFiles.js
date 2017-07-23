const fs = require('fs');
const _ = require('underscore');
const Path = require('path');

const writeFile = (filename, content) =>
  new Promise((resolve, reject) => {
    let dirname = Path.dirname(filename);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname);
    }
    fs.writeFile(filename, content, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });


module.exports = function(structure, basepath, transformCode, cb) {
  if (!cb) cb = () => true;
  let promises = _.flatten(recursiveWriteFiles(structure, basepath));
  return Promise.all(promises).then(() => cb(null, promises.length)).catch(cb);

  function recursiveWriteFiles(obj, basepath) {
    return Object.keys(obj).map((path) => {
      let content = obj[path];
      let filepath = Path.resolve(basepath, path);

      if (typeof content === 'object') {
        return recursiveWriteFiles(content, filepath);
      }
      if (transformCode) content = transformCode(content);

      return writeFile(filepath + '.js', content);
    });
  };
};

