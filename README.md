# Loopback ES6 sdk

## Description

Static code generator for Loopback models. It is generates vanila es6 classes (or you can transpile code to ES5, whatever it is still old plain javascript class) for each public model. Static and instance methods return promises according to your model definition. Static properties proposal used, so you need preset **stage-2** in your `.babelrc` .

## Usage

`npm i -g loopback-es6-sdk`

### cli: 
`lb-es6 [options] server/app.js (output folder)[src/api/]`

### options:
    -u, --url - URL of the REST API end-point
    --help    - Show help
### code:
```javascript
import { LoobpackModel } from './your_api_folder';

LoobpackModel
    .findOne({ filter })
    .then((model) = { 
        model.name = 'hello';
        return model.save();
    })
    .catch((error) => {/* ... */ })
```
or 
```javascript
new LoobpackModel({ name: 'again' }).save().catch()
```
## Roadmap

- [x] Build-in and custom static/instnace methods
- [x] Basic auth with storing token in localStorage
- [ ] Model relations
- [ ] Configurable authentication

## Developing

`mocha -t 5000 test/servicec.test.js`

And you can watch with livereload your template changes with:

`gulp watch`

## Licence

MIT