/* global describe, it */
var FidoHTML = require('../')();
var assert = require('assert');

describe('URL processor', function(){
   it('http:// URL is processed in the middle of a string', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo http://example.com bar'),
         'foo <a href="http://example.com">http://example.com</a> bar'
      );
   });
   it('https:// URL is processed in the beginning of a string', function(){
      assert.deepEqual(
         FidoHTML.fromText('https://example.com foo'),
         '<a href="https://example.com">https://example.com</a> foo'
      );
   });
   it('ftp:// URL is processed in the end of a string', function(){
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
});

describe('Plain text processor', function(){
   it('Linebreaks (LF and CR+LF) become <br> tags', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo\nbar\r\nbuzz'),
         'foo<br>bar<br>buzz'
      );
   });
   it('The second of two adjacent spaces becomes NBSP', function(){
      assert.deepEqual(
         FidoHTML.fromText(' '),
         ' '
      );
      assert.deepEqual(
         FidoHTML.fromText('  '),
         ' \u00A0'
      );
      assert.deepEqual(
         FidoHTML.fromText('   '),
         ' \u00A0 '
      );
      assert.deepEqual(
         FidoHTML.fromText('    '),
         ' \u00A0 \u00A0'
      );
   });
});