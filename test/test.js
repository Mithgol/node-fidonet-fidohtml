/* global describe, it */
var FidoHTML = require('../')();
var inDataMode = require('../')({dataMode: true});
var assert = require('assert');

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
   it('skype: URL in square brackets is processed', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo [skype:echo123] bar'),
         'foo [<a href="skype:echo123">skype:echo123</a>] bar'
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
   it('Linebreaks (LF and CR+LF) become <br> tags', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo\nbar\r\nbuzz'),
         'foo<br>bar<br>buzz'
      );
   });
});