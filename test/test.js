/* global describe, it */
var FidoHTML;
var inDataMode;
var FidoHTMLPrefixed;
var assert = require('assert');

describe('Fidonet HTML parser creation', () => {
   it('a simple Fidonet HTML parser is created', () => {
      assert.doesNotThrow(() => {
         FidoHTML = require('../')();
      });
   });
   it('a Fidonet HTML parser is created in inDataMode', () => {
      assert.doesNotThrow(() => {
         inDataMode = require('../')({dataMode: true});
      });
   });
   it('yet another parser is created with prefixed URLs', () => {
      assert.doesNotThrow(() => {
         FidoHTMLPrefixed = require('../')({URLPrefixes: {
            '*': '',
            'area': 'https://example.org/fidoviewer?',
            'fs': IPFSURL => IPFSURL.replace(/^fs:\/*/g, 'http://ipfs.io/')
         }});
      });
   });
});

describe('Inline image processor', () => {
   it('http:// image is processed in the middle of a string', () => {
      assert.deepEqual(
         FidoHTML.fromText('foo ![bar](http://example.com "baz") quux'),
         'foo <img src="http://example.com" alt="bar" title="baz"> quux'
      );
   });
   it('https:// image with a blank title is processed', () => {
      assert.deepEqual(
         FidoHTML.fromText('![foo](https://example.com "") bar'),
         '<img src="https://example.com" alt="foo"> bar'
      );
   });
   it("https:// image's title is properly escaped if necessary", () => {
      assert.deepEqual(
         FidoHTML.fromText(
            'foo ![bar](https://example.com "<baz> \\"quux\\" quuux") fnord'
         ),
         'foo <img src="https://example.com" alt="bar" ' +
         'title="&lt;baz&gt; &quot;quux&quot; quuux"> fnord'
      );
   });
   it('ftp:// URL with a missing title loses inner newlines', () => {
      assert.deepEqual(
         FidoHTML.fromText('foo ![\nbar\nbaz\n](ftp://example.com/)'),
         'foo <img src="ftp://example.com/" alt="bar baz">'
      );
   });
   it('IPFS images are directed to the default IPFS gateway', () => {
      assert.deepEqual(
         FidoHTMLPrefixed.fromText([
            'foo ',
            '![bar](fs:/ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi)',
            ' baz'
         ].join('')),
         'foo <img src="http://ipfs.io/' +
         'ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi" ' +
         'alt="bar"> baz'
      );
      assert.deepEqual(
         FidoHTMLPrefixed.fromText([
            'foo ![](',
            'fs://ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi',
            ' "bar") baz'
         ].join('')),
         'foo <img src="http://ipfs.io/' +
         'ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi" ' +
         'alt="" title="bar"> baz'
      );
      assert.deepEqual(
         FidoHTMLPrefixed.fromText([
            'foo ',
            '![bar](fs:ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi)',
            ' baz'
         ].join('')),
         'foo <img src="http://ipfs.io/' +
         'ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi" ' +
         'alt="bar"> baz'
      );
   });
   it('dataMode works fine', () => {
      assert.deepEqual(
         inDataMode.fromText('foo ![bar](http://example.com "baz") quux'),
         [
            'foo <img src="',
            'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
            '" data-src="http://example.com" alt="bar" title="baz"> quux'
         ].join('')
      );
      assert.deepEqual(
         inDataMode.fromText('foo ![bar](ftp://example.com/)'),
         [
            'foo <img src="',
            'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
            '" data-src="ftp://example.com/" alt="bar">'
         ].join('')
      );
   });
});

describe('Inline hyperlink processor', () => {
   it('http:// link is processed in the middle of a string', () => {
      assert.deepEqual(
         FidoHTML.fromText('foo [bar](http://example.com "baz") quux'),
         'foo <a href="http://example.com" title="baz">bar</a> quux'
      );
   });
   it("https:// link without a title at the string's beginning", () => {
      assert.deepEqual(
         FidoHTML.fromText('[foo](https://example.com) bar'),
         '<a href="https://example.com">foo</a> bar'
      );
   });
   it('ftp:// link with an empty title at the end of a string', () => {
      assert.deepEqual(
         FidoHTML.fromText('foo [bar](ftp://example.com/ "")'),
         'foo <a href="ftp://example.com/">bar</a>'
      );
   });
   it('a lonely mailto: hyperlink is processed', () => {
      assert.deepEqual(
         FidoHTML.fromText('[mail](mailto:someone@example.com)'),
         '<a href="mailto:someone@example.com">mail</a>'
      );
   });
   it('a mailto: scheme followed by a whitespace is not an URL', () => {
      assert.deepEqual(
         FidoHTML.fromText('[mail](mailto: someone@example.com)'),
         '[mail](mailto: someone@example.com)'
      );
   });
   it('ed2k:// hyperlink in curly braces loses its final newline', () => {
      assert.deepEqual(
         FidoHTML.fromText(
            'foo {[bar\n](ed2k://|server|example.org|4661|/)} baz'
         ),
         [
            'foo {<a href="ed2k://|server|example.org|4661|/">',
            'bar</a>} baz'
         ].join('')
      );
   });
   it('dchub:// hyperlink in carets processes its inner newlines', () => {
      assert.deepEqual(
         FidoHTML.fromText(
            'foo ^[\nbar\nbaz\n](dchub://example.org:411 "quux")^ quuux'
         ),
         [
            'foo ^<a href="dchub://example.org:411" title="quux">',
            'bar<br>baz',
            '</a>^ quuux'
         ].join('')
      );
   });
   it('skype: link in square brackets with escaped inner brackets', () => {
      assert.deepEqual(
         FidoHTML.fromText(
            'foo \\[[bar [baz\\] quux](skype:echo123)] quuux'
         ),
         'foo [<a href="skype:echo123">bar [baz] quux</a>] quuux'
      );
   });
   it('escaped outer brackets inside parentheses ([1], [2], [3]) are fine',
      () => assert.deepEqual(
         FidoHTML.fromText([
            'foo (',
            '\\[[1](http://example.org/baz)], ',
            '\\[[2](http://example.org/quux)], ',
            '\\[[3](http://example.org/quuux)]',
            ') bar'
         ].join('')),
         [
            'foo (',
            '[<a href="http://example.org/baz">1</a>], ',
            '[<a href="http://example.org/quux">2</a>], ',
            '[<a href="http://example.org/quuux">3</a>]',
            ') bar'
         ].join('')
      )
   );
   it('area:// hyperlink in angle brackets contains an image', () => {
      assert.deepEqual(
         FidoHTML.fromText([
            'foo <[',
            '![bar](http://example.com "baz")',
            '](area://Ru.Blog.Mithgol "quux")> quuux'
         ].join('')),
         [
            'foo &lt;<a href="area://Ru.Blog.Mithgol" title="quux">',
            '<img src="http://example.com" alt="bar" title="baz">',
            '</a>&gt; quuux'
         ].join('')
      );
   });
   it('an URL prefix, if given, is properly added to an area:// URL', () => {
      assert.deepEqual(
         FidoHTMLPrefixed.fromText([
            'foo <[',
            '![bar [bar\\] bar](http://example.com "baz")',
            '](area://Ru.Blog.Mithgol "quux")> quuux'
         ].join('')),
         [
            'foo &lt;<a href="',
            'https://example.org/fidoviewer?area://Ru.Blog.Mithgol',
            '" title="quux">',
            '<img src="http://example.com" alt="bar [bar] bar" title="baz">',
            '</a>&gt; quuux'
         ].join('')
      );
   });
   it('IPFS hyperlinks lead to the default IPFS gateway', () => {
      assert.deepEqual(
         FidoHTMLPrefixed.fromText([
            'foo ',
            '[bar](fs:/ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi)',
            ' baz'
         ].join('')),
         'foo <a href="http://ipfs.io/' +
         'ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi">' +
         'bar</a> baz'
      );
      assert.deepEqual(
         FidoHTMLPrefixed.fromText([
            'foo ',
            '[bar](fs://ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi)',
            ' baz'
         ].join('')),
         'foo <a href="http://ipfs.io/' +
         'ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi">' +
         'bar</a> baz'
      );
      assert.deepEqual(
         FidoHTMLPrefixed.fromText([
            'foo ',
            '[bar](fs:ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi)',
            ' baz'
         ].join('')),
         'foo <a href="http://ipfs.io/' +
         'ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi">' +
         'bar</a> baz'
      );
   });
   it('dataMode works fine', () => {
      assert.deepEqual(
         inDataMode.fromText('[foo](mailto:someone@example.com "bar")'),
         '<a href="javascript:;" data-href="mailto:someone@example.com"' +
         ' title="bar">foo</a>'
      );
      assert.deepEqual(
         inDataMode.fromText('foo \\[[bar](skype:echo123 "baz")] quux'),
         'foo [<a href="javascript:;" data-href="skype:echo123"' +
         ' title="baz">bar</a>] quux'
      );
   });
});

describe('Video runeword processor', () => {
   it('http:// video is processed in the middle of a string', () => {
      assert.deepEqual(
         FidoHTML.fromText(
            'foo [bar](http://example.com "runevideo baz") quux'
         ),
         'foo <video controls src="http://example.com" title="baz">' +
         'bar</video> quux'
      );
   });
   it("https:// video without a title at the string's beginning", () => {
      assert.deepEqual(
         FidoHTML.fromText('[foo](https://example.com "runevideo") bar'),
         '<video controls src="https://example.com">foo</video> bar'
      );
   });
   it('ftp:// video without a title at the end of a string', () => {
      assert.deepEqual(
         FidoHTML.fromText('foo [bar](ftp://example.com/ "runevideo ")'),
         'foo <video controls src="ftp://example.com/">bar</video>'
      );
   });
   it('IPFS video URLs lead to the default IPFS gateway', () => {
      assert.deepEqual(
         FidoHTMLPrefixed.fromText([
            'foo ',
            '[bar](fs:/ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi',
            ' "runevideo") baz'
         ].join('')),
         'foo <video controls src="http://ipfs.io/' +
         'ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi">' +
         'bar</video> baz'
      );
      assert.deepEqual(
         FidoHTMLPrefixed.fromText([
            'foo ',
            '[bar](fs://ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi',
            ' "runevideo baz") quux'
         ].join('')),
         'foo <video controls src="http://ipfs.io/' +
         'ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi" title="baz">' +
         'bar</video> quux'
      );
      assert.deepEqual(
         FidoHTMLPrefixed.fromText([
            'foo ',
            '[bar](fs:ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi',
            ' "runevideobaz") quux'
         ].join('')),
         'foo <video controls src="http://ipfs.io/' +
         'ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi" title="baz">' +
         'bar</video> quux'
      );
   });
});

describe('Standalone URL processor', () => {
   it('http:// URL is processed in the middle of a string', () => {
      assert.deepEqual(
         FidoHTML.fromText('foo http://example.com bar'),
         'foo <a href="http://example.com">http://example.com</a> bar'
      );
   });
   it('https:// URL is processed at the beginning of a string', () => {
      assert.deepEqual(
         FidoHTML.fromText('https://example.com foo'),
         '<a href="https://example.com">https://example.com</a> foo'
      );
   });
   it('ftp:// URL is processed at the end of a string', () => {
      assert.deepEqual(
         FidoHTML.fromText('foo ftp://example.com/'),
         'foo <a href="ftp://example.com/">ftp://example.com/</a>'
      );
   });
   it('a lonely mailto: URL is processed', () => {
      assert.deepEqual(
         FidoHTML.fromText('mailto:someone@example.com'),
         '<a href="mailto:someone@example.com">mailto:someone@example.com</a>'
      );
   });
   it('a mailto: scheme followed by a whitespace is not an URL', () => {
      assert.deepEqual(
         FidoHTML.fromText('mailto: someone@example.com'),
         'mailto: someone@example.com'
      );
   });
   it('ed2k:// URL in curly braces is processed', () => assert.deepEqual(
      FidoHTML.fromText('foo {ed2k://|server|example.org|4661|/} bar'),
      [
         'foo {<a href="ed2k://|server|example.org|4661|/">',
         'ed2k://|server|example.org|4661|/</a>} bar'
      ].join('')
   ));
   it('dchub:// URL in carets is processed', () => assert.deepEqual(
      FidoHTML.fromText('foo ^dchub://example.org:411^ bar'),
      [
         'foo ^<a href="dchub://example.org:411">',
         'dchub://example.org:411</a>^ bar'
      ].join('')
   ));
   it('skype: URL in square brackets is processed', () => assert.deepEqual(
      FidoHTML.fromText('foo [skype:echo123] bar'),
      'foo [<a href="skype:echo123">skype:echo123</a>] bar'
   ));
   it('area:// URL in angle brackets is processed', () => assert.deepEqual(
      FidoHTML.fromText('foo <area://Ru.Blog.Mithgol> bar'),
      'foo &lt;<a href="area://Ru.Blog.Mithgol">' +
      'area://Ru.Blog.Mithgol</a>&gt; bar'
   ));
   it('an URL prefix, if given, is properly added to an area:// URL', () => {
      assert.deepEqual(
         FidoHTMLPrefixed.fromText('foo <area://Ru.Blog.Mithgol> bar'),
         'foo &lt;' +
         '<a href="https://example.org/fidoviewer?area://Ru.Blog.Mithgol">' +
         'area://Ru.Blog.Mithgol</a>&gt; bar'
      );
   });
   it('IPFS URLs are directed to the default IPFS gateway', () => {
      assert.deepEqual(
         FidoHTMLPrefixed.fromText(
            'foo fs:/ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi bar'
         ),
         'foo <a href="http://ipfs.io/' +
         'ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi">' +
         'fs:/ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi</a> bar'
      );
      assert.deepEqual(
         FidoHTMLPrefixed.fromText(
            'foo fs://ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi bar'
         ),
         'foo <a href="http://ipfs.io/' +
         'ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi">' +
         'fs://ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi</a> bar'
      );
      assert.deepEqual(
         FidoHTMLPrefixed.fromText(
            'foo fs:ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi bar'
         ),
         'foo <a href="http://ipfs.io/' +
         'ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi">' +
         'fs:ipfs/QmWdss6Ucc7UrnovCmq355jSTTtLFs1amgb3j6Swb1sADi</a> bar'
      );
   });
   it('dataMode works fine', () => {
      assert.deepEqual(
         inDataMode.fromText('mailto:someone@example.com'),
         '<a href="javascript:;" data-href="mailto:someone@example.com">' +
         'mailto:someone@example.com</a>'
      );
      assert.deepEqual(
         inDataMode.fromText('foo [skype:echo123] bar'),
         'foo [<a href="javascript:;" data-href="skype:echo123">' +
         'skype:echo123</a>] bar'
      );
   });
});

describe('Plain text processor', () => {
   it('The space in the beginning of a line becomes NBSP', () => {
      assert.deepEqual(
         FidoHTML.fromText(' foo'),
         '\u00A0foo'
      );
      assert.deepEqual(
         FidoHTML.fromText('foo bar'),
         'foo bar'
      );
   });
   it('The second of two adjacent spaces becomes NBSP', () => {
      assert.deepEqual(
         FidoHTML.fromText('foo '),
         'foo '
      );
      assert.deepEqual(
         FidoHTML.fromText('foo  '),
         'foo \u00A0'
      );
      assert.deepEqual(
         FidoHTML.fromText('foo   '),
         'foo \u00A0 '
      );
      assert.deepEqual(
         FidoHTML.fromText('foo    '),
         'foo \u00A0 \u00A0'
      );
   });
   it('A starting linebreak generates both NBSP and <br>', () => {
      assert.deepEqual(
         FidoHTML.fromText('\nfoo'),
         '\u00A0<br>foo'
      );
      assert.deepEqual(
         FidoHTML.fromText('\nfoo\nbar'),
         '\u00A0<br>foo<br>bar'
      );
      assert.deepEqual(
         FidoHTML.fromText('\nfoo\n\nbar'),
         '\u00A0<br>foo<br><br>bar'
      );
   });
   it('Angle brackets are converted to &lt; and &gt;', () => {
      assert.deepEqual(
         FidoHTML.fromText('foo <bar> more'),
         'foo &lt;bar&gt; more'
      );
   });
   it('Quotes are converted to &quot;', () => {
      assert.deepEqual(
         FidoHTML.fromText('foo "bar" quux'),
         'foo &quot;bar&quot; quux'
      );
   });
   it('Ampersands are converted to &amp;', () => {
      assert.deepEqual(
         FidoHTML.fromText('for you & forever'),
         'for you &amp; forever'
      );
   });
   it('Linebreaks (LF aka 0x0A) become <br> tags', () => {
      assert.deepEqual(
         FidoHTML.fromText('foo\nbar\nbuzz'),
         'foo<br>bar<br>buzz'
      );
   });
});

describe('Tagline / tearline / origin parser, Fidonet Unicode substrings',
() => {
   it('parses tagline / tearline / origin', () => {
      assert.deepEqual(
         FidoHTML.fromText(
            'foo\nbar\n... baz\n--- quux\n * Origin: FGHI (1:2/3.4)'
         ),
         'foo<br>bar<div class="tagline">... baz</div>' +
         '<div class="tearline">--- quux</div>' +
         '<div class="originLine"> * Origin: FGHI ' +
         '(<span data-addr="1:2/3.4">1:2/3.4</span>)</div>'
      );
   });
   it('an empty tearline is fine too', () => {
      assert.deepEqual(
         FidoHTML.fromText(
            'foo\nbar\n... baz\n---\n * Origin: FGHI (1:2/3.4)'
         ),
         'foo<br>bar<div class="tagline">... baz</div>' +
         '<div class="tearline">---</div>' +
         '<div class="originLine"> * Origin: FGHI ' +
         '(<span data-addr="1:2/3.4">1:2/3.4</span>)</div>'
      );
   });
   it('an empty line before tagline / tearline / origin is kept', () => {
      assert.deepEqual(
         FidoHTML.fromText(
            'foo\n\n... baz\n---\n * Origin: FGHI (1:2/3.4)'
         ),
         'foo<br>\u00A0<div class="tagline">... baz</div>' +
         '<div class="tearline">---</div>' +
         '<div class="originLine"> * Origin: FGHI ' +
         '(<span data-addr="1:2/3.4">1:2/3.4</span>)</div>'
      );
   });
   it('URLs are processed in taglines / tearlines / origins', () => {
      assert.deepEqual(
         FidoHTML.fromText(
            'foo\nbar\n... telnet:slothmud.org:6101' +
            '\n--- The irc://irc.freenode.net/#node.js chat' +
            '\n * Origin: FGHI geo:44.58,38.11 point (1:2/3.4)'
         ),
         'foo<br>bar<div class="tagline">... ' +
         '<a href="telnet:slothmud.org:6101">telnet:slothmud.org:6101</a>' +
         '</div><div class="tearline">--- The ' +
         '<a href="irc://irc.freenode.net/#node.js">' +
         'irc://irc.freenode.net/#node.js</a> chat</div>' +
         '<div class="originLine"> * Origin: FGHI ' +
         '<a href="geo:44.58,38.11">geo:44.58,38.11</a>' +
         ' point (<span data-addr="1:2/3.4">1:2/3.4</span>)</div>'
      );
   });
   it('Fidonet Unicode substrings in these lines and the rest of the message',
   () => {
      assert.deepEqual(
         FidoHTML.fromText(
            'foo &+BDAENwRK-;\nbar\n... &+BDEEQwQ6BDg-;' +
            '\n--- &+BDIEYwQ0BDg-;' +
            '\n * Origin: &+BDMEOwQwBDMEPgQ7BEw-; (1:2/3.4)'
         ),
         'foo азъ<br>bar<div class="tagline">... буки' +
         '</div><div class="tearline">--- в\u0463ди</div>' +
         '<div class="originLine"> * Origin: глаголь ' +
         '(<span data-addr="1:2/3.4">1:2/3.4</span>)</div>'
      );
   });
});

describe('UUE decoder', () => {
   it('decodes UUE buffer with the word "Cat"', () => {
      assert.deepEqual(
         FidoHTML.fromText([
            'Foo.',
            'begin 644 buffer.bin',
            '#0V%T',
            '`',
            'end',
            'Quux.'
         ].join('\n')),
         [
            'Foo.',
            '<div class="linkUUE">',
            '<a href="data:application/octet-stream;base64,Q2F0">',
            'begin 644 buffer.bin<br>#0V%T<br>`<br>end</a></div>',
            'Quux.'
         ].join('')
      );
   });
   it('decodes UUE text with the word "Cat"', () => {
      assert.deepEqual(
         FidoHTML.fromText([
            'Foo.',
            'begin 644 cat.txt',
            '#0V%T',
            '`',
            'end',
            'Quux.'
         ].join('\n')),
         [
            'Foo.',
            '<div class="linkUUE">',
            '<a href="data:text/plain;base64,Q2F0">',
            'begin 644 cat.txt<br>#0V%T<br>`<br>end</a></div>',
            'Quux.'
         ].join('')
      );
   });
   it('can decode that text in dataMode and then leave dataMode', () => {
      FidoHTML.setOptions({
         dataMode: true
      });
      assert.deepEqual(
         FidoHTML.fromText([
            'Foo.',
            'begin 644 cat.txt',
            '#0V%T',
            '`',
            'end',
            'Quux.'
         ].join('\n')),
         [
            'Foo.',
            '<div class="fileUUE" data-name="cat.txt" data-content="Q2F0">',
            'begin 644 cat.txt<br>#0V%T<br>`<br>end</div>',
            'Quux.'
         ].join('')
      );
      FidoHTML.setOptions({
         dataMode: false
      });
      assert.deepEqual(
         FidoHTML.fromText([
            'Foo.',
            'begin 644 cat.txt',
            '#0V%T',
            '`',
            'end',
            'Quux.'
         ].join('\n')),
         [
            'Foo.',
            '<div class="linkUUE">',
            '<a href="data:text/plain;base64,Q2F0">',
            'begin 644 cat.txt<br>#0V%T<br>`<br>end</a></div>',
            'Quux.'
         ].join('')
      );
   });
   it('can use fileURLParts in an URL and then stop using them', () => {
      FidoHTML.setOptions({
         fileURLParts: [
            'https://example.org/bbs?area://Test/',
            '?time=2015'
         ]
      });
      assert.deepEqual(
         FidoHTML.fromText([
            'Foo.',
            'begin 644 cat.txt',
            '#0V%T',
            '`',
            'end',
            'Quux.'
         ].join('\n')),
         [
            'Foo.',
            '<div class="linkUUE"><a ',
            'href="https://example.org/bbs?area://Test/cat.txt?time=2015">',
            'begin 644 cat.txt<br>#0V%T<br>`<br>end</a></div>',
            'Quux.'
         ].join('')
      );
      FidoHTML.setOptions({
         fileURLParts: false
      });
      assert.deepEqual(
         FidoHTML.fromText([
            'Foo.',
            'begin 644 cat.txt',
            '#0V%T',
            '`',
            'end',
            'Quux.'
         ].join('\n')),
         [
            'Foo.',
            '<div class="linkUUE">',
            '<a href="data:text/plain;base64,Q2F0">',
            'begin 644 cat.txt<br>#0V%T<br>`<br>end</a></div>',
            'Quux.'
         ].join('')
      );
   });
});

describe('Quote processor', () => {
   it('detects simple quoted text', () => assert.deepEqual(
      inDataMode.fromText([
         'foo',
         ' bar> baz',
         ' bar> quux',
         'Fnord.'
      ].join('\n')),
      [
         'foo',
         '<blockquote data-authorID="bar" data-quoteLevel="1"',
         ' class="fidoQuote">',
         'baz<br>quux',
         '</blockquote>',
         'Fnord.'
      ].join('')
   ));
   it('detects quoted text in the beginning of a message', () => {
      assert.deepEqual(
         inDataMode.fromText([
            ' bar> baz',
            ' bar> quux',
            'Fnord.'
         ].join('\n')),
         [
            '<blockquote data-authorID="bar" data-quoteLevel="1"',
            ' class="fidoQuote">',
            'baz<br>quux',
            '</blockquote>',
            'Fnord.'
         ].join('')
      );
   });
   it('includes empty (unquoted) lines in a quote surrounding them', () => {
      assert.deepEqual(
         inDataMode.fromText([
            'Realm.',
            ' bar> baz',
            '',
            '  ',
            ' bar> quux',
            'Fnord.'
         ].join('\n')),
         [
            'Realm.',
            '<blockquote data-authorID="bar" data-quoteLevel="1"',
            ' class="fidoQuote">',
            'baz<br><br>\u00A0 <br>quux',
            '</blockquote>',
            'Fnord.'
         ].join('')
      );
   });
   it('does not include in a quote empty lines surrounding the quote', () => {
      assert.deepEqual(
         inDataMode.fromText([
            'Realm.',
            '',
            '',
            ' bar> baz',
            '',
            '  ',
            ' bar> quux',
            '',
            'Fnord.'
         ].join('\n')),
         [
            'Realm.<br><br>\u00A0',
            '<blockquote data-authorID="bar" data-quoteLevel="1"',
            ' class="fidoQuote">',
            'baz<br><br>\u00A0 <br>quux',
            '</blockquote>',
            '\u00A0<br>',
            'Fnord.'
         ].join('')
      );
   });
   it('detects a quote inside another quote (FSC-0032.001 violation)', () => {
      assert.deepEqual(
         inDataMode.fromText([
            'Realm.',
            '',
            '',
            ' foo> bar',
            ' foo> baz> quux',
            ' foo> quuux',
            '',
            'Fnord.'
         ].join('\n')),
         [
            'Realm.<br><br>\u00A0',
            '<blockquote data-authorID="foo" data-quoteLevel="1"',
            ' class="fidoQuote">',
            'bar',
            '<blockquote data-authorID="baz" data-quoteLevel="1"',
            ' class="fidoQuote">',
            'quux',
            '</blockquote>',
            'quuux',
            '</blockquote>',
            '\u00A0<br>',
            'Fnord.'
         ].join('')
      );
   });
   it("does not allow left angle bracket in quote's initials", () => {
      assert.deepEqual(
         FidoHTML.fromText('<foo> bar'),
         '&lt;foo&gt; bar'
      );
      assert.deepEqual(
         inDataMode.fromText('<foo> bar'),
         '&lt;foo&gt; bar'
      );
   });
});

describe('Fixed width character lines detector', () => {
   it("pseudographical box characters' width is fixed", () => {
      assert.deepEqual(
         FidoHTML.fromText([
            'Foo bar',
            '╔═══════╗',
            '║ Baz.  ║',
            '╟───────╢',
            '║ Quux. ║',
            '╚═══════╝',
            'Fnord.'
         ].join('\n')),
         [
            'Foo bar',
            '<div class="monospaceBlock"><code>',
            '╔═══════╗<br>',
            '║ Baz. \u00A0║<br>',
            '╟───────╢<br>',
            '║ Quux. ║<br>',
            '╚═══════╝</code></div>',
            'Fnord.'
         ].join('')
      );
   });
   it('URLs are hyperlinked in blocks of fixed width characters', () => {
      assert.deepEqual(
         FidoHTML.fromText([
            'Foo bar',
            '╔═══════════════╗',
            '║ Baz.          ║',
            '╟───────────────╢',
            '║ skype:echo123 ║',
            '╚═══════════════╝',
            'Fnord.'
         ].join('\n')),
         [
            'Foo bar',
            '<div class="monospaceBlock"><code>',
            '╔═══════════════╗<br>',
            '║ Baz. \u00A0 \u00A0 \u00A0 \u00A0 \u00A0║<br>',
            '╟───────────────╢<br>',
            '║ <a href="skype:echo123">skype:echo123</a> ║<br>',
            '╚═══════════════╝</code></div>',
            'Fnord.'
         ].join('')
      );
   });
   it('correctly presents empty lines surrounding a block', () => {
      assert.deepEqual(
         FidoHTML.fromText([
            'Foo bar',
            '',
            '╔═══════════════╗',
            '║ Baz.          ║',
            '╟───────────────╢',
            '║ skype:echo123 ║',
            '╚═══════════════╝',
            '',
            'Fnord.'
         ].join('\n')),
         [
            'Foo bar<br>\u00A0',
            '<div class="monospaceBlock"><code>',
            '╔═══════════════╗<br>',
            '║ Baz. \u00A0 \u00A0 \u00A0 \u00A0 \u00A0║<br>',
            '╟───────────────╢<br>',
            '║ <a href="skype:echo123">skype:echo123</a> ║<br>',
            '╚═══════════════╝</code></div>',
            '\u00A0<br>Fnord.'
         ].join('')
      );
   });
});
