/* global describe, it */
var FidoHTML;
var inDataMode;
var FidoHTMLPrefixArea;
var assert = require('assert');

describe('Fidonet HTML parser creation', function(){
   it('a simple Fidonet HTML parser is created', function(){
      assert.doesNotThrow(function(){
         FidoHTML = require('../')();
      });
   });
   it('a Fidonet HTML parser is created in inDataMode', function(){
      assert.doesNotThrow(function(){
         inDataMode = require('../')({dataMode: true});
      });
   });
   it('yet another parser is created with prefixed area:// URLs', function(){
      assert.doesNotThrow(function(){
         FidoHTMLPrefixArea = require('../')({URLPrefixes: {
            '*': '',
            'area': 'https://example.org/fidoviewer?'
         }});
      });
   });
});

describe('URL processor', function(){
   it('http:// URL is processed in the middle of a string', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo http://example.com bar'),
         'foo <a href="http://example.com">http://example.com</a> bar'
      );
   });
   it('https:// URL is processed at the beginning of a string', function(){
      assert.deepEqual(
         FidoHTML.fromText('https://example.com foo'),
         '<a href="https://example.com">https://example.com</a> foo'
      );
   });
   it('ftp:// URL is processed at the end of a string', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo ftp://example.com/'),
         'foo <a href="ftp://example.com/">ftp://example.com/</a>'
      );
   });
   it('a lonely mailto: URL is processed', function(){
      assert.deepEqual(
         FidoHTML.fromText('mailto:someone@example.com'),
         '<a href="mailto:someone@example.com">mailto:someone@example.com</a>'
      );
   });
   it('a mailto: scheme followed by a whitespace is not an URL', function(){
      assert.deepEqual(
         FidoHTML.fromText('mailto: someone@example.com'),
         'mailto: someone@example.com'
      );
   });
   it('ed2k:// URL in curly braces is processed', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo {ed2k://|server|example.org|4661|/} bar'),
         [
            'foo {<a href="ed2k://|server|example.org|4661|/">',
            'ed2k://|server|example.org|4661|/',
            '</a>} bar'
         ].join('')
      );
   });
   it('dchub:// URL in carets is processed', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo ^dchub://example.org:411^ bar'),
         [
            'foo ^<a href="dchub://example.org:411">',
            'dchub://example.org:411',
            '</a>^ bar'
         ].join('')
      );
   });
   it('skype: URL in square brackets is processed', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo [skype:echo123] bar'),
         'foo [<a href="skype:echo123">skype:echo123</a>] bar'
      );
   });
   it('area:// URL in angle brackets is processed', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo <area://Ru.Blog.Mithgol> bar'),
         'foo &lt;<a href="area://Ru.Blog.Mithgol">' +
         'area://Ru.Blog.Mithgol</a>&gt; bar'
      );
   });
   it('an URL prefix is added to an area:// URL', function(){
      assert.deepEqual(
         FidoHTMLPrefixArea.fromText('foo <area://Ru.Blog.Mithgol> bar'),
         'foo &lt;' +
         '<a href="https://example.org/fidoviewer?area://Ru.Blog.Mithgol">' +
         'area://Ru.Blog.Mithgol</a>&gt; bar'
      );
   });
   it('dataMode works fine', function(){
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

describe('Plain text processor', function(){
   it('The space in the beginning of a line becomes NBSP', function(){
      assert.deepEqual(
         FidoHTML.fromText(' foo'),
         '\u00A0foo'
      );
      assert.deepEqual(
         FidoHTML.fromText('foo bar'),
         'foo bar'
      );
   });
   it('The second of two adjacent spaces becomes NBSP', function(){
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
   it('A starting linebreak generates both NBSP and <br>', function(){
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
   it('Angle brackets are converted to &lt; and &gt;', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo <bar> more'),
         'foo &lt;bar&gt; more'
      );
   });
   it('Quotes are converted to &quot;', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo "bar" quux'),
         'foo &quot;bar&quot; quux'
      );
   });
   it('Ampersands are converted to &amp;', function(){
      assert.deepEqual(
         FidoHTML.fromText('for you & forever'),
         'for you &amp; forever'
      );
   });
   it('Linebreaks (LF aka 0x0A) become <br> tags', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo\nbar\nbuzz'),
         'foo<br>bar<br>buzz'
      );
   });
});

describe('Tagline / tearline / origin parser, Fidonet Unicode substrings',
function(){
   it('parses tagline / tearline / origin', function(){
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
   it('an empty tearline is fine too', function(){
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
   it('an empty line before tagline / tearline / origin is kept', function(){
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
   it('URLs are processed in taglines / tearlines / origins', function(){
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
   function(){
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

describe('UUE decoder', function(){
   it('decodes UUE buffer with the word "Cat"', function(){
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
   it('decodes UUE text with the word "Cat"', function(){
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
   it('can decode that text in dataMode and then leave dataMode', function(){
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
   it('can use fileURLParts in an URL and then stop using them', function(){
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

describe('Quote processor', function(){
   it('detects simple quoted text', function(){
      assert.deepEqual(
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
      );
   });
   it('detects quoted text in the beginning of a message', function(){
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
   it('includes empty (unquoted) lines in a surrounding quote', function(){
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
   it('does not include empty lines surrounding a quote', function(){
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
   it('detects a quote inside another quote (FSC-0032.001 violation)',
   function(){
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
   it("does not allow left angle bracket in quote's initials", function(){
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

describe('Fixed width character lines detector', function(){
   it("pseudographical box characters' width is fixed", function(){
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
   it('URLs are hyperlinked in blocks of fixed width characters',
   function(){
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
});
