/* global describe, it */
var FidoHTML = require('../')();
var assert = require('assert');

describe('Fidonet message to HTML converter', function(){
   it('converts linebreaks (LF and CR+LF) to <br> tags', function(){
      assert.deepEqual(
         FidoHTML.fromText('foo\nbar\r\nbuzz'),
         'foo<br>bar<br>buzz'
      );
   });
});