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

let Note, app;

describe('services generator', function() {
  before(function(done) {
    app = require('./testApp/server/server');
    var options = {
      apiUrl: 'http://localhost:3333/api',
    };
    var output = generateServices(app, options);

    app.start();

    writeFiles(output, 'test/generatedFiles', babelTransform).then(() => {
      Note = require('./generatedFiles/').Note;

      done();
    });
  });

  describe('default static methods', function() {
    it('Molde.create(data)', function(done) {
      Note.create({
        title: 'foo',
        content: 'bar',
      })
        .then(note => {
          expect(note).to.be.an.instanceof(Note);
          expect(note.id).to.be.equal(1);
          expect(note.title).to.be.equal('foo');
          done();
        })
        .catch(done);
    });

    it('Molde.patchOrCreate(data)', function(done) {
      Note.patchOrCreate({
        id: 1,
        title: 'upserted foo',
      })
        .then(note => {
          expect(note).to.be.an.instanceof(Note);
          expect(note.title).to.be.equal('upserted foo');
          done();
        })
        .catch(done);
    });

    it('Molde.replaceOrCreate(data)', function(done) {
      Note.replaceOrCreate({
        title: 'replaced foo',
      })
        .then(note => {
          expect(note).to.be.an.instanceof(Note);
          expect(note.title).to.be.equal('replaced foo');
          done();
        })
        .catch(done);
    });

    it('Molde.upsertWithWhere(data)', function(done) {
      Note.upsertWithWhere(
        {
          title: 'replaced foo',
        },
        {
          title: 'upsertedWithWhere foo',
        }
      )
        .then(note => {
          expect(note).to.be.an.instanceof(Note);
          expect(note.title).to.be.equal('upsertedWithWhere foo');
          done();
        })
        .catch(done);
    });

    it('Molde.exists(id)', function(done) {
      Note.exists(2)
        .then(info => {
          expect(info.exists).to.be.equal(true);
          done();
        })
        .catch(done);
    });

    it('Molde.findById(id)', function(done) {
      Note.findById(2)
        .then(note => {
          expect(note).to.be.an.instanceof(Note);
          done();
        })
        .catch(done);
    });

    it('Molde.replaceById(id, data)', function(done) {
      Note.replaceById(2, {
        title: 'replaced by id',
      })
        .then(note => {
          expect(note).to.be.an.instanceof(Note);
          expect(note.title).to.be.equal('replaced by id');
          done();
        })
        .catch(done);
    });

    it('Model.find(filter)', function(done) {
      Note.find({})
        .then(res => {
          expect(res).to.be.a('array');
          expect(res[0]).to.be.an.instanceof(Note);
          done();
        })
        .catch(done);
    });

    it('Model.find(filter)', function(done) {
      Note.findOne({
        id: 1,
      })
        .then(res => {
          expect(res).to.be.an.instanceof(Note);
          done();
        })
        .catch(done);
    });

    it('Model.updateAll(where, data)', function(done) {
      Note.updateAll(
        {
          title: 'replaced by id',
        },
        {
          title: 'updatedAll',
        }
      )
        .then(info => {
          expect(info.count).to.be.equal(1);
          done();
        })
        .catch(done);
    });

    it('Model.deleteById(id)', function(done) {
      Note.deleteById(2)
        .then(info => {
          expect(info.count).to.be.equal(1);
          done();
        })
        .catch(done);
    });

    it('Model.count(where)', function(done) {
      Note.count({})
        .then(info => {
          expect(info.count).to.be.equal(1);
          done();
        })
        .catch(done);
    });

    it('Model.createChangeStream(options)');
  });

  describe('default instance methods', function() {
    it('patchAttributes(data)', function(done) {
      Note.create({
        title: 'not patched',
      })
        .then(instance =>
          instance.patchAttributes({
            title: 'patched!',
          })
        )
        .then(instance => {
          expect(instance).to.be.an.instanceof(Note);
          expect(instance.title).to.equal('patched!');
          done();
        }).catch(done);
    });
  });

  describe('custom methods', function() {
    it('Model.customPost(arg1, arg2, query1, query2)', function(done) {
      Note.customPost(1, 2, 'a', 'b')
        .then(res => {
          expect(res).to.be.a('object');
          expect(res).to.be.deep.equal({
            arg1: 1,
            arg2: 2,
            query1: 'a',
            query2: 'b',
          });
          done();
        })
        .catch(done);
    });

    it('Model.customGet(arg1, arg2, query1, query2)', function(done) {
      Note.customGet(1, {}, {}, 'b')
        .then(res => {
          expect(res).to.be.a('array');
          expect(res[0]).to.be.an.instanceof(Note);
          done();
        })
        .catch(done);
    });

    it('Model.prototype.customPatch(arg1)', function(done) {
      let instance = new Note({
        id: 1,
      });
      instance.customPatch(1)
        .then(res => {
          expect(res).to.be.an('object');
          expect(res.arg1).to.be.equal(1);
          done();
        })
        .catch(done);
    });
  });
});
