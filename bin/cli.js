#!/usr/bin/env node
'use strict';

const path = require('path');
const SG = require('strong-globalize');
SG.SetRootDir(path.resolve(__dirname, '..'));
const g = SG();
const fs = require('fs');
const semver = require('semver');

const argv = require('yargs')
  .epilogue('Generate ES6 models from your Loopback 3 app')
  .describe('u', g.f('URL of the REST API end-point'))
  .alias({ u: 'url', m: 'module-name', s: 'include-schema' })
  .usage('Usage: $0 [options] server/app.js (output folder)[src/api/]')
  .help().argv;

const generator = require('../lib/es6services');
const writeFiles = require('../lib/utils/writeFiles');

// var argv = optimist
//   .usage(g.f(
//     'Generate {{Angular $resource}} services ' +
//     'for your {{LoopBack}} application.' +
//     '\nUsage:' +
//     '\n    $0 {{[options] server/app.js [client/js/lb-services.js]}}'))
//   .describe('m', g.f('The name for generated {{Angular}} module.'))
//   .default('m', 'lbServices')
//   .describe('u', g.f('URL of the REST API end-point'))
//   .describe('s', 'Include schema definition in generated models')
//   .boolean('s')
//   .alias({ u: 'url', m: 'module-name', s: 'include-schema' })
//   .demand(1)
//   .argv;

var appFile = path.resolve(argv._[0]);
var outputFolder = argv._[1];

g.error('Loading {{LoopBack}} app %j', appFile);
var app = require(appFile);
assertLoopBackVersion();

if (app.booting) {
  app.on('booted', runGenerator);
} else {
  runGenerator();
}

function runGenerator() {
  var ngModuleName = argv['module-name'] || 'lbServices';
  var apiUrl = argv['url'] || app.get('restApiRoot') || '/api';
  var includeSchema = argv['include-schema'] || false;

  g.error('Generating %j for the API endpoint %j', ngModuleName, apiUrl);
  var result = generator(app, {
    ngModuleName: ngModuleName,
    apiUrl: apiUrl,
    includeSchema: includeSchema,
  });

  if (outputFolder) {
    outputFolder = path.resolve(outputFolder);
    g.error('Saving the generated services source to %j', outputFolder);
    writeFiles(result, outputFolder).then(() => {
      process.exit();
    });
  } else {
    g.error('Dumping to {{stdout}}');
    process.stdout.write(result);
  }
}

//--- helpers ---//

function assertLoopBackVersion() {
  var Module = require('module');

  // Load the 'loopback' module in the context of the app.js file,
  // usually from node_modules/loopback of the project of app.js
  var loopback = Module._load('loopback', Module._cache[appFile]);

  if (semver.lt(loopback.version, '1.6.0')) {
    g.error(
      '\n' +
        'The code generator does not support applications based on\n' +
        '{{LoopBack}} versions older than 1.6.0. Please upgrade your project\n' +
        'to a recent version of {{LoopBack}} and run this tool again.\n'
    );
    process.exit(1);
  }
}
