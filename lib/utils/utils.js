const HTTP_TEMPLATE_REGEXP = /\/:(.+?\b)/g;

class AcceptsParser {
  constructor(accepts, route, verb) {
    if (typeof accepts === 'object' && !Array.isArray(accepts)) {
      accepts = [accepts];
    }
    this.route = route;
    this.routeArgs = AcceptsParser.getRouteParams(route);
    this.innerParams = AcceptsParser.getInnerParams(accepts);

    accepts = AcceptsParser.prepareAccepts(
      accepts,
      this.routeArgs,
      this.innerParams,
      verb
    );
    this.arguments = accepts.map(i => i.arg);
    this.queryParams = accepts.filter(item => item.http.source === 'query');
    this.pathParams = accepts.filter(item => item.http.source === 'path');
    this.bodyParams = accepts.filter(item => item.http.source === 'body');
    this.formParams = accepts.filter(item => item.http.source === 'form');
  }

  static getRouteParams(route) {
    let pathArgs = [];
    route.replace(HTTP_TEMPLATE_REGEXP, function(str, $1) {
      pathArgs.push($1);
    });

    return pathArgs;
  }

  static getInnerParams(accepts) {
    return accepts.filter(function(arg) {
      let http = arg.http || {};
      return (
        typeof http === 'function' ||
        ['req', 'res', 'context'].indexOf(http.source) + 1
      );
    });
  }

  static prepareAccepts(accepts, routeArgs, innerParams, verb) {
    return accepts
      .filter(item => !(innerParams.indexOf(item) + 1))
      .map(item => {
        item.http = item.http || {};
        let isPath = routeArgs.indexOf(item.arg) + 1;
        if (!item.http.source) {
          if (isPath) {
            item.http.source = 'path';
          } else if (verb === 'GET') {
            item.http.source = 'query';
          } else {
            item.http.source = 'form';
          }
        }
        return item;
      });
  }

  templateString() {
    let queryArgs = this.queryParams.map(item => item.arg);
    let url = this.route.replace(HTTP_TEMPLATE_REGEXP, (str, $1) => {
      let pathArgs = this.pathParams.map(i => i.arg);
      // loopback return /{arg}/ route part if arg has inappropriate source
      return pathArgs.indexOf($1) + 1 ? '/${' + $1 + '}' : '/${this.' + $1 + '}';
    });
    if (queryArgs.length)
      url += '${queryParams({ ' + queryArgs.join(', ') + ' })}';
    return url;
  }

  getBodyData() {
    if (this.bodyParams.length) {
      if (this.bodyParams.length > 1) {
        console.warn(
          'Your remote method definition is invalid. There should be only one body argument'
        );
      }
      return this.bodyParams[0].arg;
    } else if (this.formParams.length) {
      if (this.bodyParams.length) {
        console.warn(
          'Your remote method definition is invalid. There should be only one body argument'
        );
      }

      return this.formParams.map(i => i.arg);
    } else {
      return null;
    }
  }
}

const returnsParser = (models, returns) => {
  let info = {
    instanceClass: null,
    isArray: false,
  };

  if (typeof returns === 'object' && !Array.isArray(returns)) {
    returns = [returns];
  }

  if (returns.length === 1) {
    if (!returns[0].root) return info;

    let type = returns[0].type;

    if (Array.isArray(type)) {
      type = type[0];
      info.isArray = true;
    }

    if (models.indexOf(type) + 1) {
      info.instanceClass = type;
    }
    return info;
  } else {
    return info;
  }
};

const returnClasses = (models, returnsArray) =>
  returnsArray
    .map(returns => returnsParser(models, returns))
    .filter(info => info.instanceClass)
    .map(info => info.instanceClass)
    .reduce((prev, curr) => {
      if (!(prev.indexOf(curr) + 1)) {
        prev.push(curr);
      }
      return prev;
    }, []);

function mapAliases(methods, isStatic) {
  var aliases = {};

  methods.forEach(function(method) {
    if (
      method.sharedMethod.aliases.length &&
      method.sharedMethod.isStatic === isStatic
    ) {
      aliases[method.sharedMethod.name] = method.sharedMethod.aliases;
    }
  });
  return aliases;
}

const traverseJson = (obj, initObject = {}, fn) => {
  if (typeof initObject === 'function') {
    fn = initObject;
    initObject = {};
  }
  for (var key in obj) {
    let content = obj[key];

    if (typeof content === 'object') {
      initObject[key] = {};
      traverseJson(content, initObject[key], fn);
    } else {
      initObject[key] = fn(content, key);
    }
  }
  return initObject;
};

module.exports = {
  mapAliases,
  AcceptsParser,
  returnsParser,
  returnClasses,
  traverseJson,
};
