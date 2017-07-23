module.exports = function(Note) {
  Note.customPost = function(arg1, arg2, query1, query2, cb) {
    process.nextTick(() => {
      return cb(null, arg1, arg2, query1, query2);
    });
  };
  Note.customGet = function(arg1, arg2, query1, query2, cb) {
    process.nextTick(() => {
      return cb(null, [new Note()]);
    });
  };

  Note.prototype.customPatch = function(arg1, cb) {
    process.nextTick(() => {
      return cb(null, arg1);
    });
  };
};
