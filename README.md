[![(a histogram of downloads)](https://nodei.co/npm-dl/fidohtml.png?height=3)](https://npmjs.org/package/fidohtml)

The **Fidonet HTML** module makes HTML code out of a Fidonet message.

This module is written in JavaScript and requires [Node.js](http://nodejs.org/) to run.
* Starting from v2.0.0, this module requires Node.js version 6.0.0 (or newer) because it is rewritten in ECMAScript 2016 (ES7).
* Starting from v1.0.0, this module requires Node.js version 4.0.0 (or newer) because it is rewritten in ECMAScript 2015 (ES6).
* You may run older versions of this module in Node.js version 0.10.x or 0.12.x. These older versions of this module, however, had to contain additional dependencies as polyfills for missing ECMAScript 2015 (ES6) features which are now present in Node.js. And those older versions of Node.js are themselves not maintained by their developers after 2016-12-31.

This repository also contains draft standards of **Fidonet runes** for the Fidonet Global Hypertext Interface project.

* The [`runes.txt`](runes.txt) file is the English version of the draft.

* The [`runes.rus.txt`](runes.rus.txt) file is the Russian version of the draft. This version is provided in UTF-8 (for the diffs to look reasonably good on GitHub and other git tools) and thus should be converted to CP866 encoding (common in Russian Fidonet) before posting to Fidonet.

This module is a reference implementation of these standards.

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

### Options

The `options` object (or any of its properties) may be absent. When present, the following properties are used:

* `options.dataMode` — by default it is `false`; when it's `true`, some HTML5 attributes remain unpopulated and the corresponding `data-XXXX` attributes are populated instead. (In this mode additional client-side JavaScript processing of HTML5 tags becomes necessary. Useful for whitelisting, preprocessing or otherwise preventing the default behaviour of a browser.)

* `options.fontColor` — by default it is `false`; when it's `true`, some elements are enclosed in `<font color="…">` and `</font>` tags. Such mode is useful when the necessary CSS styles are not expected to be available for HTML output; for example, if HTML is exported in RSS to some RSS browser or to some web site that does not expect specific (Fidonet-related) values of the `class="…"` attribute.

* `options.color` — an object with the properties containing colors that are used in `color="…"` attributes when `options.fontColor` is `true`. These colors are:
   * `options.color.origin` — color of the origin line (see FTS-0004.001, “Conference Mail Message Control Information”, section 3). By default, [clrs.cc](http://clrs.cc/) maroon.
   * `options.color.tearline` — color of the tearline (see FTS-0004.001, “Conference Mail Message Control Information”, section 2). By default, [clrs.cc](http://clrs.cc/) olive.
   * `options.color.tagline` — color of the tagline. By default, [clrs.cc](http://clrs.cc/) orange.

* ![(TODO: not ready)](https://img.shields.io/badge/TODO-%28not_ready%29-001f3f.svg?style=plastic) `options.styleCodes` — by default it is `'Yes'`; this string (not case-sensitive) may have one of the following values that control the processing of style codes:
   * `'Yes'` (default) — style codes affect the style of words surrounded by them. There are four types of style codes: `*asterisks*`, `_underscores_`, `#hashes#` or `/slashes/` around words.
   * `'Hide'` — same as above, but the style codes themselves are not displayed.
   * `'No'` — style codes are ignored (treated as any other characters).

* `options.fileURLParts` — by default it is `false`; when altered, it should be given an array of two strings that control the appearance of an URL for every uuencoded file in the message: the first string is added before the filename and the second string is added after a filename to get the complete URL of that file. (For example, when the array `['https://example.org/fidonet?area://Test/', '?time=2015']` is given, it means that the file `example.zip` has the complete URL `https://example.org/fidonet?area://Test/example.zip?time=2015`.) The default `false` value means that there's no known way to construct a file's URL from its name. (In that default case an [RFC2397-compliant](http://tools.ietf.org/html/rfc2397) Data URI of the file is created and used. Its length is usually much greater.)
   * **Note:**   URLs of the files are not affected by the `URLPrefixes` option.

* `options.URLPrefixes` — by default it is `{'*': ''}`; in this object properties' names correspond to URL schemes and properties' values correspond to the prefixes that should be added to URLs (encountered in the message) when these URLs are finally converted to hyperlinks (or to images' addresses). For example, the URL `telnet:towel.blinkenlights.nl` gets converted to a hyperlink pointing to `https://example.org/console?telnet:towel.blinkenlights.nl` if `options.URLPrefixes.telnet` is `'https://example.org/console?'`.
   * If a mere prefix is not sufficient, a function may be given that accepts an original URL and returns the transformed URL (such function must be synchronous).
   * The value of `options.URLPrefixes['*']` is used when the value for a particular URL scheme is `undefined`.

### Methods

The constructed object has the following methods:

#### setOptions(options)

This method can be used to alter some (or all) of the options that were previously set in the constructor. It affects the subsequent `.fromText` calls.

#### fromText(messageText)

This method generates (and returns) HTML code from the given Fidonet message's text.

That text (`messageText`) is expected to be given in a JavaScript string (a Unicode string, not a binary) and with LF line endings (`'\n'`, i.e. hexadecimal `0A`).

This method merely performs the conversions prepared beforehand in the constructor. Therefore the conversions are controlled only by the options given to the constructor or to the `.setOptions` method. The `.fromText` method does not accept any additional options to alter those that were previously given.

The following conversions are performed:

* Origin line (see [FTS-0004.001](http://ftsc.org/docs/fts-0004.001), “Conference Mail Message Control Information”, section 3) is wrapped in `<div class="originLine">`. The origin's address part is additionally wrapped in `<span data-addr="…">`. The whole origin is also wrapped in `<font color="…">` (using `options.color.origin`) when `options.fontColor` is `true`.

* Tearline (see [FTS-0004.001](http://ftsc.org/docs/fts-0004.001), “Conference Mail Message Control Information”, section 2) is wrapped in `<div class="tearline">`. It is also wrapped in `<font color="…">` (using `options.color.tearline`) when `options.fontColor` is `true`.

* A tagline (a line that immediately precedes the origin and/or the tearline and starts with three dots `...`) is wrapped in `<div class="tagline">`. It is also wrapped in `<font color="…">` (using `options.color.tagline`) when `options.fontColor` is `true`.

* Properly quoted text (see [FSC-0032.001](http://ftsc.org/docs/fsc-0032.001)) is wrapped in `blockquote class="fidoQuote" data-authorID="…" data-quoteLevel="…"` tag. (The value of `data-authorID` contains the quote's author's initials, and the value of `data-quoteLevel` contains the number of the following “greater than” characters. However, these `data-` attributes do not appear if `options.dataMode == false`.) The tag is then wrapped in additional `<blockquote class="fidoQuoteOuter">` tags if the `quoteLevel` is greater than 1 (these outer tags do not have `data-` attributes even if `options.dataMode == true`). For example, a quote preceded by `MtW>>>` characters would be converted to the following HTML (newlines and indentation added here for clarity):

```html
<blockquote class="fidoQuoteOuter">
   <blockquote class="fidoQuoteOuter">
      <blockquote data-authorID="MtW" data-quoteLevel="2" class="fidoQuote">
         ... quoted text goes here ...
      </blockquote>
   </blockquote>
</blockquote>
```

* The above conversion is recursively applied to the quote's contents, and thus even improperly quoted text (where a quote appears inside another quote despite being forbidden in FSC-0032.001) is also processed. For example, if `options.dataMode == true`, then a quote preceded by `foo> bar>` characters would be converted to the following HTML (newlines and indentation added here for clarity):

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
      * `options.dataMode == true` → a `data-source` attribute is also added to that `div`, containing the base64-encoded HTML5 representation of UUE codes
   * If a UUE block does not represent an image,
      * `options.dataMode == false` → the block of UUE code lines is wrapped in `a` element with a `href` attribute containing an URL of the decoded file. That element is additionally wrapped in `div class="linkUUE"` element.
         * If `options.fileURLParts` is an array, `href` contains an URL of the decoded file constructed using the array's elements and the file's name. Otherwise an [RFC2397-compliant](http://tools.ietf.org/html/rfc2397) Data URI of the decoded file is used.
      * `options.dataMode == true` → the block of UUE code lines is wrapped in `div class="fileUUE"` element with the following attributes:
         * `data-name` — name of the encoded file
         * `data-content` — base64-encoded content of the file

* [Fidonet Unicode substrings](https://github.com/Mithgol/fiunis) are converted to their Unicode equivalents (but not in UUE blocks).

* Inline Markdown-alike image declarations `![alt text](URL "title")` are converted to images.
   * Backslashes can be used to escape literal closing square brackets (i.e. `\]` means a literal `]` character) in the alternative text to prevent a premature ending of the text.
   * Backslashes can be used to escape literal quotes (i.e. `\"` means a literal `"` character) in the title to prevent a premature ending of the title.
   * Leading and training newlines are ignored in the alternative text. Inner newlines become whitespaces.
   * Titles are optional (i.e. `(URL)` can be given instead of `(URL "title")`).
   * A value from `options.URLPrefixes` is used to modify an URL. (See above: “[Options](#options)”.)
   * `options.dataMode == false` → the URL is copied to the image's `src` attribute.
   * `options.dataMode == true` → an [RFC2397-compliant](http://tools.ietf.org/html/rfc2397) Data URI of [the tiniest GIF](http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever) appears in the image's `src` attribute and the real image's URL is copied to the image's `data-src` attribute instead of `src`. (Use JavaScript for whitelisting, preprocessing or otherwise preventing the default browser's action.)

* Inline Markdown-alike hyperlink declarations `[link text](URL "title")` are converted to hyperlinks.
   * Inline Markdown-alike hyperlink declarations may contain inline Markdown-alike image declarations in link texts.
   * Backslashes can be used to escape literal closing square brackets (i.e. `\]` means a literal `]` character) in the link's text to prevent a premature ending of the text.
   * Backslashes can be used to escape literal opening square brackets (i.e. `\[` means a literal `[` character) immediately before the link's text to prevent a premature beginning of the text (for example, if a hyperlink should appear in square brackets, then the opening bracket should be escaped).
   * Backslashes can be used to escape literal quotes (i.e. `\"` means a literal `"` character) in the title to prevent a premature ending of the title.
   * Leading and training newlines are ignored in the link's text. Inner newlines become HTML linebreaks (`<br>` tags).
   * Titles are optional (i.e. `(URL)` can be given instead of `(URL "title")`).
   * A value from `options.URLPrefixes` is used to modify an URL. (See above: “[Options](#options)”.)
   * `options.dataMode == false` → the URL is copied to the tag's `href` attribute.
   * `options.dataMode == true` → `href="javascript:;"` attribute appears and the URL is copied to the tag's `data-href` attribute instead of `href`. (Use JavaScript for whitelisting, preprocessing or otherwise preventing the default browser's action.)

* Standalone URLs become hyperlinks, i.e. each URL is wrapped in `<a>…</a>` tags (unless it has already been processed as a part of some Markdown-alike declaration).
   * A value from `options.URLPrefixes` is used to modify an URL. (See above: “[Options](#options)”.)
   * `options.dataMode == false` → the URL is copied to the tag's `href` attribute.
   * `options.dataMode == true` → `href="javascript:;"` attribute appears and the URL is copied to the tag's `data-href` attribute instead of `href`. (Use JavaScript for whitelisting, preprocessing or otherwise preventing the default browser's action.)

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

[![(build testing status)](https://img.shields.io/travis/Mithgol/node-fidonet-fidohtml/master.svg?style=plastic)](https://travis-ci.org/Mithgol/node-fidonet-fidohtml)

It is necessary to install [Mocha](https://mochajs.org/) and [JSHint](http://jshint.com/) for testing.

* You may install Mocha globally (`npm install mocha -g`) or locally (`npm install mocha` in the directory of the Fidonet HTML module).

* You may install JSHint globally (`npm install jshint -g`) or locally (`npm install jshint` in the directory of the Fidonet HTML module).

After that you may run `npm test` (in the directory of the Fidonet HTML module).

## License

MIT License, see the `LICENSE` file.