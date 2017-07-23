// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: loopback-sdk-angular
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

const expect = require('chai').expect;
const generateServices = require('../lib/es6services');
const loopback = require('loopback');
const babel = require('babel-core');
const fetch = require('node-fetch');
const writeFiles = require('../lib/utils/writeFiles');

require('isomorphic-fetch');
global.FormData = require('form-data');

function babelTransform(code) {
  return babel.transform(code, {
    presets: ['es2015', 'stage-2'],
  }).code;
}

let User, app;

describe('User  generator', function() {
  before(function(done) {
    app = require('./testApp/server/server');
    var options = {
      apiUrl: 'http://localhost:3333/api',
    };
    var output = generateServices(app, options);

    app.start();

    writeFiles(output, 'test/generatedFiles', babelTransform).then(() => {
      User = require('./generatedFiles').user;

      done();
    });
  });

  describe('User static methods', function() {
    it('User.login({ username, password })', done => {
      User.login({
        username: 'user1',
        password: 'user1',
      })
        .then(accessToken => {
          expect(accessToken.userId).to.be.equal(1);
          done();
        })
        .catch(done);
    });

    it('User.logout()', done => {
      User.login({
        username: 'user1',
        password: 'user1',
      })
        .then(accessToken => {
          expect(accessToken.userId).to.be.equal(1);
          done();
        })
        .catch(done);
    });
  });
});
