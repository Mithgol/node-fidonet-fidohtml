The **Fidonet HTML** module makes HTML code out of a Fidonet message.

It is a module for Node.js (using Node.js version 0.10.x is recommended).

## Installing Fidonet HTML

[![(npm package version)](https://nodei.co/npm/fidohtml.png?downloads=true&downloadRank=true)](https://npmjs.org/package/fidohtml)

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

* `options.dataMode` — by default it is `false`; when it's `true`, some HTML5 attributes remain unpopulated and the corresponding `data-XXXX` attributes are populated instead. (In this mode additional client-side JavaScript processing of HTML5 tags becomes necessary. Useful for whitelisting, preprocessing or otherwise preventing the default behaviour of a browser.)

* `options.fontColor` — by default it is `false`; when it's `true`, some elements are enclosed in `<font color="…">` and `</font>` tags. Such mode is useful when the necessary CSS styles are not expected to be available for HTML output; for example, if HTML is exported in RSS to some RSS browser or to some web site that does not expect specific (Fidonet-related) values of the `class="…"` attribute.

* `options.color` — an object with the properties containing colors that are used in `color="…"` attributes when `options.fontColor` is `true`. These colors are:
   * `options.color.origin` — color of the origin line (see FTS-0004.001, “Conference Mail Message Control Information”, section 3). By default, [clrs.cc](http://clrs.cc/) maroon.
   * `options.color.tearline` — color of the tearline (see FTS-0004.001, “Conference Mail Message Control Information”, section 2). By default, [clrs.cc](http://clrs.cc/) olive.
   * `options.color.tagline` — color of the tagline. By default, [clrs.cc](http://clrs.cc/) orange.

The constructed object has the following method:

### fromText(messageText)

Generates (and returns) HTML code from the given Fidonet message's text. That text is expected to be given in a JavaScript string (a Unicode string, not a binary) and with LF line endings (`'\n'`, i.e. hexadecimal `0A`).

The following conversions are performed:

* Origin line (see [FTS-0004.001](http://ftsc.org/docs/fts-0004.001), “Conference Mail Message Control Information”, section 3) is wrapped in `<div class="originLine">`. The origin's address part is additionally wrapped in `<span data-addr="…">`. The whole origin is also wrapped in `<font color="…">` (using `options.color.origin`) when `options.fontColor` is `true`.

* Tearline (see [FTS-0004.001](http://ftsc.org/docs/fts-0004.001), “Conference Mail Message Control Information”, section 2) is wrapped in `<div class="tearline">`. It is also wrapped in `<font color="…">` (using `options.color.tearline`) when `options.fontColor` is `true`.

* A tagline (a line that immediately precedes the origin and/or the tearline and starts with three dots `...`) is wrapped in `<div class="tagline">`. It is also wrapped in `<font color="…">` (using `options.color.tagline`) when `options.fontColor` is `true`.

* Properly quoted text (see [FSC-0032.001](http://ftsc.org/docs/fsc-0032.001)) is wrapped in `blockquote class="fidoQuote" data-authorID="…" data-quoteLevel="…"` tag. (The value of `data-authorID` contains the quote's author's initials, and the value of `data-quoteLevel` contains the number of the following “greater than” characters. However, these `data-` attributes do not appear if `options.dataMode === false`.) The tag is then wrapped in additional `<blockquote class="fidoQuoteOuter">` tags if the `quoteLevel` is greater than 1 (these outer tags do not have `data-` attributes even if `options.dataMode === true`). For example, a quote preceded by `MtW>>>` characters would be converted to the following HTML (newlines and indentation added for clarity):

```html
<blockquote class="fidoQuoteOuter">
   <blockquote class="fidoQuoteOuter">
      <blockquote data-authorID="MtW" data-quoteLevel="2" class="fidoQuote">
         ... quoted text goes here ...
      </blockquote>
   </blockquote>
</blockquote>
```

* [Uuencoded](https://en.wikipedia.org/wiki/Uuencoding) data (unless it is quoted) is decoded and may appear as an image or a hyperlink:
   * If a UUE block represents an image (i.e. if the [`mime`](https://www.npmjs.org/package/mime) package thinks that the block's filename corresponds to `'image/jpeg'`, or `'image/png'`, or `'image/gif'`, or `'image/svg+xml'` MIME type), then it is converted to an image. (The image's `src` attribute contains an [RFC2397-compliant](http://tools.ietf.org/html/rfc2397) Data URI of the image.) The image is wrapped in a `div` element with `class="imageUUE"` and a `data-name` attribute containing the file's name.
      * `options.dataMode === true` → a `data-source` attribute is also added, containing the base64-encoded HTML5 representation of UUE codes
   * If a UUE block does not represent an image,
      * `options.dataMode === false` → the block is wrapped in `a class="fileUUE"` element with a `href` attribute containing an [RFC2397-compliant](http://tools.ietf.org/html/rfc2397) Data URI of the decoded file.
      * `options.dataMode === true` → the block is wrapped in `div class="fileUUE"` element with the following attributes:
         * `data-name` — name of the encoded file
         * `data-content` — base64-encoded content of the file

* [Fidonet Unicode substrings](https://github.com/Mithgol/fiunis) are converted to their Unicode equivalents (but not in UUE blocks).

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