The **Fidonet HTML** module makes HTML code out of a Fidonet message.

## Installing Fidonet HTML

[![(npm package version)](https://badge.fury.io/js/fidohtml.png)](https://npmjs.org/package/fidohtml)

* Latest packaged version: `npm install fidohtml`

* Latest githubbed version: `npm install https://github.com/Mithgol/node-fidonet-fidohtml/tarball/master`

You may visit https://github.com/Mithgol/node-fidonet-fidohtml#readme occasionally to read the latest `README` because the package's version is not planned to grow after changes when they happen in `README` only. (However, `npm publish --force` may happen eventually.)

## Using Fidonet HTML

When you `require()` the installed module, you get a constructor that uses the options object as its parameter:

```js
var FidoHTML = require('fidohtml');
var decoder = FidoHTML(options);
```

The options object may be absent. (It's currently ignored anyway.)

The constructed object has the following method:

### fromText(messageText)

Generates (and returns) HTML code from the given Unicode message's text.

* Converts linebreaks to `<br>` tags.

* The second of two adjacent spaces is converted to a no-break space.

## Testing Fidonet HTML

[![(build testing status)](https://travis-ci.org/Mithgol/node-fidonet-fidohtml.png?branch=master)](https://travis-ci.org/Mithgol/node-fidonet-fidohtml)

It is necessary to install [Mocha](http://visionmedia.github.io/mocha/) and [JSHint](http://jshint.com/) for testing.

* You may install Mocha globally (`npm install mocha -g`) or locally (`npm install mocha` in the directory of the Fidonet HTML module).

* You may install JSHint globally (`npm install jshint -g`) or locally (`npm install jshint` in the directory of the Fidonet HTML module).

After that you may run `npm test` (in the directory of the Fidonet HTML module).

## License

MIT License, see the `LICENSE` file.