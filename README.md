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

* `options.styleCodes` — by default it is `'Yes'`; this string (not case-sensitive) may have one of the following values that control the processing of style codes:
   * `'Yes'` (default) — style codes affect the style of words surrounded by them. There are four types of style codes: `*asterisks*`, `_underscores_`, `#hashes#` or `/slashes/` around words.
   * `'Hide'` — same as above, but the style codes themselves are not displayed.
   * `'No'` — style codes are ignored (treated as any other characters).

* `options.fileURLParts` — by default it is `false`; when altered, it should be given an array of two strings where the first string is added before and the second string is added after a filename to get the complete URL of that file. (For example, when the array `['https://example.org/fidonet?area://Test/', '?time=2015']` is given, it means that the file `example.zip` has the complete URL `https://example.org/fidonet?area://Test/example.zip?time=2015`.) The default `false` value means that the file's URL is not known (and thus some [RFC2397-compliant](http://tools.ietf.org/html/rfc2397) Data URI of the file has to be used instead of it).
   * **Note:**   URLs of the files are not affected by the `URLPrefixes` option.

* `options.URLPrefixes` — by default it is `{'*': ''}`; in this object properties' names correspond to URL schemes and properties' values correspond to the prefixes that should be added to URLs when they are converted to hyperlinks. (For example, the URL `telnet:towel.blinkenlights.nl` gets converted to the hyperlink pointing to `https://example.org/console?telnet:towel.blinkenlights.nl` if `options.URLPrefixes.telnet` is `'https://example.org/console?'`.) The value of `options.URLPrefixes['*']` is used when the value for a particular URL scheme is `undefined`.

The constructed object has the following methods:

### setOptions(options)

This method can be used to alter some (or all) of the options that were previously set in the constructor. It affects the subsequent `.fromText` calls.

### fromText(messageText)

This method generates (and returns) HTML code from the given Fidonet message's text.

That text (`messageText`) is expected to be given in a JavaScript string (a Unicode string, not a binary) and with LF line endings (`'\n'`, i.e. hexadecimal `0A`).

This method merely performs the conversions prepared beforehand in the constructor. Therefore the conversions are controlled only by the options given to the constructor or to the `.setOptions` method. The `.fromText` method does not accept any additional options to alter those that were previously given.

The following conversions are performed:

* Origin line (see [FTS-0004.001](http://ftsc.org/docs/fts-0004.001), “Conference Mail Message Control Information”, section 3) is wrapped in `<div class="originLine">`. The origin's address part is additionally wrapped in `<span data-addr="…">`. The whole origin is also wrapped in `<font color="…">` (using `options.color.origin`) when `options.fontColor` is `true`.

* Tearline (see [FTS-0004.001](http://ftsc.org/docs/fts-0004.001), “Conference Mail Message Control Information”, section 2) is wrapped in `<div class="tearline">`. It is also wrapped in `<font color="…">` (using `options.color.tearline`) when `options.fontColor` is `true`.

* A tagline (a line that immediately precedes the origin and/or the tearline and starts with three dots `...`) is wrapped in `<div class="tagline">`. It is also wrapped in `<font color="…">` (using `options.color.tagline`) when `options.fontColor` is `true`.

* Properly quoted text (see [FSC-0032.001](http://ftsc.org/docs/fsc-0032.001)) is wrapped in `blockquote class="fidoQuote" data-authorID="…" data-quoteLevel="…"` tag. (The value of `data-authorID` contains the quote's author's initials, and the value of `data-quoteLevel` contains the number of the following “greater than” characters. However, these `data-` attributes do not appear if `options.dataMode === false`.) The tag is then wrapped in additional `<blockquote class="fidoQuoteOuter">` tags if the `quoteLevel` is greater than 1 (these outer tags do not have `data-` attributes even if `options.dataMode === true`). For example, a quote preceded by `MtW>>>` characters would be converted to the following HTML (newlines and indentation added here for clarity):

```html
<blockquote class="fidoQuoteOuter">
   <blockquote class="fidoQuoteOuter">
      <blockquote data-authorID="MtW" data-quoteLevel="2" class="fidoQuote">
         ... quoted text goes here ...
      </blockquote>
   </blockquote>
</blockquote>
```

* The above conversion is recursively applied to the quote's contents, and thus even improperly quoted text (where a quote appears inside another quote despite being forbidden in FSC-0032.001) is also processed. For example, if `options.dataMode === true`, then a quote preceded by `foo> bar>` characters would be converted to the following HTML (newlines and indentation added here for clarity):

```html
<blockquote data-authorID="foo" data-quoteLevel="1" class="fidoQuote">
   <blockquote data-authorID="bar" data-quoteLevel="1" class="fidoQuote">
      ... quoted text goes here ...
   </blockquote>
</blockquote>
```

* [Uuencoded](https://en.wikipedia.org/wiki/Uuencoding) data (unless it is quoted) is decoded and may appear as an image or a hyperlink:
   * If a UUE block represents an image (i.e. if the [`mime`](https://www.npmjs.org/package/mime) package thinks that the block's filename corresponds to `'image/jpeg'`, or `'image/png'`, or `'image/gif'`, or `'image/svg+xml'` MIME type), then it is converted to an image. The image is wrapped in a `div` element with `class="imageUUE"` and a `data-name` attribute containing the file's name. The image's `src` attribute contains an URL of the image.
      * If `options.fileURLParts` is an array, `src` contains an URL of the image constructed using the array's elements and the file's name. Otherwise an [RFC2397-compliant](http://tools.ietf.org/html/rfc2397) Data URI of the image is used.
      * `options.dataMode === true` → a `data-source` attribute is also added to that `div`, containing the base64-encoded HTML5 representation of UUE codes
   * If a UUE block does not represent an image,
      * `options.dataMode === false` → the block of UUE code lines is wrapped in `a` element with a `href` attribute containing an URL of the decoded file. That element is additionally wrapped in `div class="linkUUE"` element.
         * If `options.fileURLParts` is an array, `href` contains an URL of the decoded file constructed using the array's elements and the file's name. Otherwise an [RFC2397-compliant](http://tools.ietf.org/html/rfc2397) Data URI of the decoded file is used.
      * `options.dataMode === true` → the block of UUE code lines is wrapped in `div class="fileUUE"` element with the following attributes:
         * `data-name` — name of the encoded file
         * `data-content` — base64-encoded content of the file

* [Fidonet Unicode substrings](https://github.com/Mithgol/fiunis) are converted to their Unicode equivalents (but not in UUE blocks).

* URLs become hyperlinks, i.e. each URL is wrapped in `<a>…</a>` tags.
   * `options.dataMode === false` → the URL is copied to the tag's `href` attribute.
   * `options.dataMode === true` → `href="javascript:;"` attribute appears and the URL is copied to the tag's `data-href` attribute instead of `href`. (Use JavaScript for whitelisting, preprocessing or otherwise preventing the default browser's action.)
   * A value from `options.URLPrefixes` is added before an URL. (For example, the URL `telnet:towel.blinkenlights.nl` is converted to `https://example.org/console?telnet:towel.blinkenlights.nl` if `options.URLPrefixes.telnet` is `'https://example.org/console?'`.) The value of `options.URLPrefixes['*']` is used when the prefix value for a particular URL scheme is `undefined`.

* If lines of text contain any character for [Box Drawing](http://www.unicode.org/charts/PDF/U2500.pdf) (except `U+2500`) or [Block Elements](http://www.unicode.org/charts/PDF/U2580.pdf), then a sequence of such lines is wrapped in `<code>…</code>` tags (to be rendered with some monospace font) and then also in `<div class="monospaceBlock">…</div>`. The latter is useful in CSS in the following cases:
   * When the style of `.monospaceBlock > code` elements has to be different from the other `code` elements.
   * When the `line-height` inside a `.monospaceBlock` has to be different.

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