const gulp = require('gulp');
const notifier = require('node-notifier');
const _invalidateRequireCacheForFile = function(filePath) {
  delete require.cache[require.resolve(filePath)];
};

const requireNoCache = function(filePath) {
  _invalidateRequireCacheForFile(filePath);
  return require(filePath);
};

gulp.task('watch', () => {
  gulp.watch('lib/**/*', function(event) {
    const generateServices = requireNoCache('./lib/es6services');
    const writeFiles = require('./lib/utils/writeFiles');
    let app = require('./test/testApp/server/server');
    let options = {
      apiUrl: 'http://localhost:3333/api',
    };
    let output;
    try {
      output = generateServices(app, options);
    } catch (err) {
      console.log('err', err);
      notifier.notify({
        title: 'Compile error',
        message: err.message,
      });
    }
    if (output) {
      writeFiles(output, 'generatedFiles').then(() => {});
    }
  });
});

gulp.task('default', ['watch']);
