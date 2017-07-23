const expect = require('chai').expect;
const utils = require('../lib/utils/utils');
const AcceptsParser = utils.AcceptsParser;
const traverseJson = utils.traverseJson;
const returnsParser = utils.returnsParser;
const returnClasses = utils.returnClasses;

let accepts;

describe('Traverse json', () => {
  it('should recurcive traverse json and apply function to value', () => {
    let json = {
      PersistedModel: 'content',
      folder: {
        SomeModel: 'another content',
      },
    };

    let traverseFn = value => 'hello ' + value;

    let modifiedJson = traverseJson(json, {}, traverseFn);
    expect(modifiedJson).to.be.deep.equal({
      PersistedModel: 'hello content',
      folder: {
        SomeModel: 'hello another content',
      },
    });
  });
});

describe('AcceptsParser filtering accept params', function() {
  it('AcceptsParser with one param', () => {
    let route = '/Notes/:model/:id/:arg1';
    let accepts = { arg: 'arg1' };

    let instance = new AcceptsParser(accepts, route, 'GET');

    expect(instance.pathParams).to.include(accepts);
  });

  it('AcceptsParser should filter params, that recieved from context', () => {
    let route = '/Notes/:model/:id/:arg1';
    accepts = [
      { arg: 'arg1' },
      {
        arg: 'arg2',
        http: function() {},
      },
      {
        arg: 'query1',
        http: {
          source: 'req',
        },
      },
      { arg: 'query2' },
    ];

    let instance = new AcceptsParser(accepts, route, 'GET');

    expect(instance.innerParams).to.include(accepts[1]);
    expect(instance.innerParams).to.include(accepts[2]);
    expect(instance.innerParams).to.not.include(accepts[0]);
    expect(instance.innerParams).to.not.include(accepts[4]);
  });

  it('AcceptsParser should have routeArgs names', () => {
    let route = '/Notes/:model/:id/:arg1';
    let instance = new AcceptsParser(accepts, route, 'GET');

    expect(instance.routeArgs).to.have.members(['model', 'id', 'arg1']);
    expect(instance.routeArgs.length).to.equal(3);
  });

  it('AcceptsParser should filter input params, and populate proper data', () => {
    let routeArgs = ['arg1'];
    let inputGET = [
      { arg: 'arg1' },
      { arg: 'query2' },
      {
        arg: 'arg2',
        http: function() {},
      },
    ];

    let inputPOST = [
      { arg: 'arg1' },
      { arg: 'query2' },
      {
        arg: 'arg2',
        http: function() {},
      },
    ];

    let acceptsGET = AcceptsParser.prepareAccepts(
      inputGET,
      routeArgs,
      [accepts[2]],
      'GET'
    );
    let acceptsPOST = AcceptsParser.prepareAccepts(
      inputPOST,
      routeArgs,
      [accepts[2]],
      'POST'
    );

    expect(acceptsGET[0].http.source).to.be.equal('path');
    expect(acceptsPOST[0].http.source).to.be.equal('path');

    expect(acceptsGET[1].http.source).to.be.equal('query');
    expect(acceptsPOST[1].http.source).to.be.equal('form');
  });

  it('AcceptsParser should sort accept params by http input (GET)', () => {
    let route = '/Notes/:model/:id/:arg1';
    let accepts = [
      // query but not in path
      {
        arg: 'arg1',
        http: {
          source: 'query',
        },
      },
      // in path but without source
      {
        arg: 'id',
      },
      // all right
      {
        arg: 'model',
        http: {
          source: 'path',
        },
      },
      // form and body won't work for GET
    ];
    let instance = new AcceptsParser(accepts, route, 'GET');
    expect(instance.queryParams).to.have.include(accepts[0]);
    expect(instance.queryParams.length).to.equal(1);
    expect(instance.pathParams).to.have.members([accepts[1], accepts[2]]);
    expect(instance.pathParams.length).to.equal(2);
  });

  it('AcceptsParser should sort accept params by http input (POST)', () => {
    let route = '/Notes/:model/:id/:arg1';
    let accepts = [
      {
        arg: 'arg1',
        http: {
          source: 'query',
        },
      },
      {
        arg: 'id',
      },
      {
        arg: 'model',
        http: {
          source: 'body',
        },
      },
      {
        arg: 'arg2',
        http: {
          source: 'form',
        },
      },
      {
        arg: 'arg3',
      },
    ];
    let instance = new AcceptsParser(accepts, route, 'POST');
    expect(instance.queryParams).to.have.include(accepts[0]);
    expect(instance.queryParams.length).to.equal(1);
    expect(instance.pathParams).to.have.members([accepts[1]]);
    expect(instance.pathParams.length).to.equal(1);
    expect(instance.bodyParams).to.have.members([accepts[2]]);
    expect(instance.bodyParams.length).to.equal(1);
    expect(instance.formParams).to.have.members([accepts[3], accepts[4]]);
    expect(instance.formParams.length).to.equal(2);
  });
});

describe('AcceptsParser instance method templateString()', () => {
  it('replace :arg in string to ${arg}', function() {
    let route = '/Notes/:model/:id/:arg1';
    let accepts = [{ arg: 'model' }, { arg: 'id' }, { arg: 'arg1' }];
    let instance = new AcceptsParser(accepts, route, 'GET');

    let output = instance.templateString();
    expect(output).to.be.equal('/Notes/${model}/${id}/${arg1}');
  });

  it('same with query', function() {
    let route = '/Notes/:model/:id/:arg1';
    let accepts = [
      { arg: 'model' },
      { arg: 'id' },
      {
        arg: 'arg1',
        http: {
          source: 'query',
        },
      },
    ];
    let instance = new AcceptsParser(accepts, route, 'GET');

    let output = instance.templateString();
    expect(output).to.be.equal(
      '/Notes/${model}/${id}/${this.arg1}${queryParams({ arg1 })}'
    );
  });
});

describe('ReturnsParser', () => {
  it('Array of models', () => {
    let models = ['Note', 'Customer'];
    let returns = {
      arg: 'data',
      type: ['Note'],
      root: true,
    };

    let info = returnsParser(models, returns);
    expect(info.isArray).to.be.equal(true);
    expect(info.instanceClass).to.be.equal('Note');
  });

  it('Model instance', () => {
    let models = ['Note', 'Customer'];
    let returns = [
      {
        arg: 'data',
        type: 'Note',
        root: true,
      },
    ];

    let info = returnsParser(models, returns);
    expect(info.isArray).to.be.equal(false);
    expect(info.instanceClass).to.be.equal('Note');
  });

  it('Some JSON data', () => {
    let models = ['Note', 'Customer'];
    let returns = [
      {
        arg: 'data',
        type: 'string',
      },
    ];

    let info = returnsParser(models, returns);
    expect(info.isArray).to.be.equal(false);
    expect(info.instanceClass).to.be.equal(null);

    returns = [
      {
        arg: 'data',
        type: 'string',
      },
      {
        arg: 'data2',
        type: 'Note',
      },
    ];

    info = returnsParser(models, returns);
    expect(info.isArray).to.be.equal(false);
    expect(info.instanceClass).to.be.equal(null);
  });

  it('Return all models in returns', () => {
    let returns = [
      [
        {
          arg: 'data',
          type: 'Customer',
          root: true,
        },
      ],
      [
        {
          arg: 'data',
          type: 'Review',
          root: true,
        },
      ],
      [
        {
          arg: 'data',
          type: 'object',
          root: true,
        },
      ],
    ];

    let models = returnClasses(['Customer', 'Note', 'Review'], returns);
    expect(models).to.have.members(['Customer', 'Review']);
  });
});
