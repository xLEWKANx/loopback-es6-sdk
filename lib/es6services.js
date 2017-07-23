var fs = require('fs');
var ejs = require('ejs');
var extend = require('util')._extend;
var g = require('strong-globalize')();
var utils = require('./utils/utils');
var AcceptsParser = utils.AcceptsParser;
var _ = require('underscore');

module.exports = function generateServices(app, options) {
  if (typeof options === 'string') {
    // legacy API: generateServices(app, ngModuleName, apiUrl)
    options = {
      ngModuleName: arguments[1],
      apiUrl: arguments[2],
    };
  }

  options = extend(
    {
      ngModuleName: 'lbServices',
      apiUrl: '/',
      includeCommonModules: true,
      namespaceModels: false,
      namespaceCommonModels: false,
      namespaceDelimiter: '.',
      modelsToIgnore: [],
    },
    options
  );

  var models = describeModels(app, options);

  var templatePaths = {
    utils: {
      fetch: './templates/fetch.ejs',
      HttpError: './templates/HttpError.ejs',
      storage: './templates/storage.ejs',
    },
    lib: {
      CustomModel: './templates/CustomModel.ejs',
    },
    index: './templates/index.ejs',
  };

  let templates = utils.traverseJson(templatePaths, {}, (path, name) =>
    fs.readFileSync(require.resolve(path), { encoding: 'utf-8' })
  );

  var files = {
    utils: utils.traverseJson(templates.utils, ejs.render),
    lib: renderModels(templates.lib, models, options),
  };

  files.index = ejs.render(templates.index, files);

  return files;
};

function renderModels(templates, models, options) {
  let modelnames = Object.keys(models);

  let files = {};

  Object.keys(models).forEach(function(modelname) {
    var model = models[modelname];
    var template = templates[modelname] ?
      templates[modelname] :
      templates.CustomModel;

    model.aliases = {
      static: utils.mapAliases(model.methods, true),
      instance: utils.mapAliases(model.methods, false),
    };

    model.resource = model.routes[0].path;

    let returnsArr = model.methods.map((method) => method.returns);
    // I thought about relations from schema, but they can be not public;
    let returnClasses = utils.returnClasses(modelnames, returnsArr);
    let dependencies = _.without(returnClasses, modelname);

    model.methods = getMethodsInfo(model.methods, returnClasses);

    // var relationMethods = model.filter(function(method) {
    //   TODO;
    // });

    files[modelname] = ejs.render(template, {
      urlBase: options.apiUrl.replace(/\/+$/, ''),
      modelname: modelname,
      relationNames: dependencies,
      methods: model.methods,
      resource: model.resource,
      // moduleName: options.ngModuleName,
      // models: models,
      // commonAuth: commonModelPrefix + 'Auth',
      // commonAuthRequestInterceptor: commonModelPrefix +
      //   'AuthRequestInterceptor',
      // commonResource: commonModelPrefix + 'Resource',
      // commonResourceProvider: commonModelPrefix + 'ResourceProvider',
      // includeCommonModules: options.includeCommonModules,

      // helpers: {
      //   getPropertyOfFirstEndpoint: getPropertyOfFirstEndpoint,
      // },
    });
  });

  return files;
}

function getMethodsInfo(methods, modelnames) {
  return methods.map((function(method) {
    method.methodVerb = method.getEndpoints()[0].verb;
    method.route = method.routes[0].path;

    var accepts = new AcceptsParser(method.accepts, method.route, method.methodVerb);
    let returnsInfo = utils.returnsParser(modelnames, method.returns);
    method.isReturnArray = returnsInfo.isArray;
    method.returnsClass = returnsInfo.instanceClass;


    var path = accepts.templateString();
    method.urlTemplate = path;
    method.body = accepts.getBodyData();

    method.isStatic = method.sharedMethod.isStatic;
    method.name = method.sharedMethod.name;

    method.arguments = accepts.arguments;

    return method;
  }));
}

function getFormattedModelName(modelName, options) {
  // Always capitalize first letter of model name
  var resourceModelName = modelName[0].toUpperCase() + modelName.slice(1);

  // Prefix with the module name and delimiter if namespacing is on
  if (options.namespaceModels) {
    resourceModelName =
      options.ngModuleName + options.namespaceDelimiter + resourceModelName;
  }
  return resourceModelName;
}

function describeModels(app, options) {
  var result = {};
  var modelsToIgnore = options.modelsToIgnore;

  // var PersistedModel = app.loopback.getModel('PersistedModel');

  // // expose PersistedModel to REST
  // app.model(PersistedModel);

  app.handler('rest').adapter.getClasses().forEach(function(c) {
    var name = c.name;
    c.description = c.sharedClass.ctor.settings.description;

    if (modelsToIgnore.indexOf(name) >= 0) {
      // Skip classes that are provided in options.modelsToIgnore array
      // We don't want to publish these models in angular app
      g.warn('Skipping %j model as it is not to be published', name);
      return;
    }

    if (!c.ctor) {
      // Skip classes that don't have a shared ctor
      // as they are not LoopBack models
      g.error('Skipping %j as it is not a {{LoopBack}} model', name);
      return;
    }

    c.isUser =
      c.sharedClass.ctor.prototype instanceof app.loopback.User ||
      c.sharedClass.ctor.prototype === app.loopback.User.prototype;
    result[name] = c;
  });

  // buildScopes(result);
  // if (options.includeSchema) {
  buildSchemas(result, app);
  // }

  return result;
}

var SCOPE_METHOD_REGEX = /^prototype.__([^_]+)__(.+)$/;

function buildScopes(models) {
  for (var modelName in models) {
    buildScopesOfModel(models, modelName);
  }
}

function buildScopesOfModel(models, modelName) {
  var modelClass = models[modelName];
  modelClass.scopes = {};
  modelClass.methods.forEach(function(method) {
    buildScopeMethod(models, modelName, method);
  });

  return modelClass;
}

// reverse-engineer scope method
// defined by loopback-datasource-juggler/lib/scope.js
function buildScopeMethod(models, modelName, method) {
  var modelClass = models[modelName];
  var match = method.name.match(SCOPE_METHOD_REGEX);
  if (!match) return;

  var op = match[1];
  var scopeName = match[2];
  var modelPrototype = modelClass.sharedClass.ctor.prototype;
  var targetClass =
    modelPrototype[scopeName] && modelPrototype[scopeName]._targetClass;

  if (modelClass.scopes[scopeName] === undefined) {
    if (!targetClass) {
      g.error(
        'Warning: scope %s.%s is missing {{_targetClass}} property.' +
          "\nThe {{Angular}} code for this scope won't be generated." +
          '\nPlease upgrade to the latest version of' +
          '\n{{loopback-datasource-juggler}} to fix the problem.',
        modelName,
        scopeName
      );
      modelClass.scopes[scopeName] = null;
      return;
    }

    if (!findModelByName(models, targetClass)) {
      g.error(
        'Warning: scope %s.%s targets class %j, which is not exposed \nvia' +
          " remoting. The {{Angular}} code for this scope won't be generated.",
        modelName,
        scopeName,
        targetClass
      );
      modelClass.scopes[scopeName] = null;
      return;
    }

    modelClass.scopes[scopeName] = {
      methods: {},
      targetClass: targetClass,
    };
  } else if (modelClass.scopes[scopeName] === null) {
    // Skip the scope, the warning was already reported
    return;
  }

  var apiName = scopeName;
  if (op == 'get') {
    // no-op, create the scope accessor
  } else if (op == 'delete') {
    apiName += '.destroyAll';
  } else {
    apiName += '.' + op;
  }

  // Names of resources/models in Angular start with a capital letter
  var ngModelName = modelName[0].toUpperCase() + modelName.slice(1);
  method.internal = 'Use ' + ngModelName + '.' + apiName + '() instead.';

  // build a reverse record to be used in ngResource
  // Product.__find__categories -> Category.::find::product::categories
  var reverseName = '::' + op + '::' + modelName + '::' + scopeName;

  var reverseMethod = Object.create(method);
  reverseMethod.name = reverseName;
  reverseMethod.internal = 'Use ' + ngModelName + '.' + apiName + '() instead.';
  // override possibly inherited values
  reverseMethod.deprecated = false;

  var reverseModel = findModelByName(models, targetClass);
  reverseModel.methods.push(reverseMethod);
  if (reverseMethod.name.match(/create/)) {
    var createMany = Object.create(reverseMethod);
    createMany.name = createMany.name.replace(/create/, 'createMany');
    createMany.internal = createMany.internal.replace(/create/, 'createMany');
    createMany.isReturningArray = function() {
      return true;
    };
    reverseModel.methods.push(createMany);
  }

  var scopeMethod = Object.create(method);
  scopeMethod.name = reverseName;
  // override possibly inherited values
  scopeMethod.deprecated = false;
  scopeMethod.internal = false;
  modelClass.scopes[scopeName].methods[apiName] = scopeMethod;
  if (scopeMethod.name.match(/create/)) {
    var scopeCreateMany = Object.create(scopeMethod);
    scopeCreateMany.name = scopeCreateMany.name.replace(/create/, 'createMany');
    scopeCreateMany.isReturningArray = function() {
      return true;
    };
    apiName = apiName.replace(/create/, 'createMany');
    modelClass.scopes[scopeName].methods[apiName] = scopeCreateMany;
  }
}

function findModelByName(models, name) {
  for (var n in models) {
    if (n.toLowerCase() == name.toLowerCase()) return models[n];
  }
}

function buildSchemas(models, app) {
  for (var modelName in models) {
    var modelClass = app.models[modelName];
    var modelProperties = app.models[modelName].definition.properties;
    var schema = {};
    for (var prop in modelProperties) {
      // eslint-disable-line one-var
      schema[prop] = extend({}, modelProperties[prop]);
      // normalize types - convert from ctor (function) to name (string)
      var type = schema[prop].type;
      if (typeof type === 'function') {
        type = type.modelName || type.name;
      }
      // TODO - handle array types
      schema[prop].type = type;
    }

    models[modelName].modelSchema = {
      name: modelName,
      properties: schema,
      relations: modelClass.relations,
    };
  }
}



