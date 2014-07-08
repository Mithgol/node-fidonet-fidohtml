The **Fidonet HTML** module makes HTML code out of a Fidonet message.

It requires Node.js version 0.8 (or newer) because npm-driven installation [fails](https://github.com/npm/npm/issues/4379) on Node.js version 0.6 (or older).

## Installing Fidonet HTML

[![(npm package version)](https://nodei.co/npm/fidohtml.png?downloads=true)](https://npmjs.org/package/fidohtml)

* Latest packaged version: `npm install fidohtml`

* Latest githubbed version: `npm install https://github.com/Mithgol/node-fidonet-fidohtml/tarball/master`

You may visit https://github.com/Mithgol/node-fidonet-fidohtml#readme occasionally to read the latest `README` because the package's version is not planned to grow after changes when they happen in `README` only. (And `npm publish --force` is [forbidden](http://blog.npmjs.org/post/77758351673/no-more-npm-publish-f) nowadays.)

## Using Fidonet HTML

When you `require()` the installed module, you get a constructor that uses an optional `options` object as its parameter:

```js
var FidoHTML = require('fidohtml');
var decoder = FidoHTML(options);
```

The `options` object (or any of its properties) may be absent. When present, the following properties are used:

* `options.dataMode` — by default it is `false`; when it's true, some HTML5 attributes remain unpopulated and the corresponding `data-XXXX` attributes are populated instead. (In this mode additional client-side JavaScript processing of HTML5 tags becomes necessary. Useful for whitelisting, preprocessing or otherwise preventing the default behaviour of a browser.)

The constructed object has the following method:

### fromText(messageText)

Generates (and returns) HTML code from the given Unicode message's text.

* URLs become hyperlinks, i.e. each URL is wrapped in `<a>…</a>` tags.
   * `options.dataMode === false` → the URL is copied to the tag's `href` attribute.
   * `options.dataMode === true` → `href="javascript:;"` attribute appears and the URL is copied to the tag's `data-href` attribute instead of `href`. (Use JavaScript for whitelisting, preprocessing or otherwise preventing the default browser's action.)

* A space in the beginning of a line is converted to a no-break space.

* The second of two adjacent spaces is converted to a no-break space.

* Angle brackets (`<` and `>`) are converted to `&lt;` and `&gt;`.

* Quotes (`"`) are converted to `&quot;`.

* Ampersands (`&`) are converted to `&amp;`.

* Linebreaks become `<br>` tags.

## Testing Fidonet HTML

[![(build testing status)](https://travis-ci.org/Mithgol/node-fidonet-fidohtml.svg?branch=master)](https://travis-ci.org/Mithgol/node-fidonet-fidohtml)

It is necessary to install [Mocha](http://visionmedia.github.io/mocha/) and [JSHint](http://jshint.com/) for testing.

* You may install Mocha globally (`npm install mocha -g`) or locally (`npm install mocha` in the directory of the Fidonet HTML module).

* You may install JSHint globally (`npm install jshint -g`) or locally (`npm install jshint` in the directory of the Fidonet HTML module).

After that you may run `npm test` (in the directory of the Fidonet HTML module).

## License

MIT License, see the `LICENSE` file.