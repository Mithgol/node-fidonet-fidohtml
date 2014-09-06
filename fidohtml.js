var ASTree = require('astree');
var Dauria = require('dauria');
var extend = require('extend');
var MIME = require('mime');
var UUE = require('uue');
var _s = require('underscore.string');

var defaults = {
   dataMode: false
};

var FidoHTML = function(options){
   if (!(this instanceof FidoHTML)) return new FidoHTML(options);

   this.options = extend(true, {}, defaults, options);

   var _converter = this;
   this.ASTree = ASTree();

   // do not break spaces in the beginning of the lines
   // note: this replacement cannot be further down,
   //       because then it would treat the beginning of a fragment
   //       as a beginning of a line (e.g. a space after a hyperlink)
   this.ASTree.defineSplitter(function(sourceText){
      return sourceText.replace(/(^|\r?\n) /g, '$1\u00A0');
   });

   // detect (and isolate) UUE code fragments
   this.ASTree.defineSplitter(function(inputData){
      if( typeof inputData !== 'string' ) return inputData;
      return UUE.split(inputData);
   }, [
      { type: 'quote', props: [ 'quotedText' ] }
   ]);
   this.ASTree.defineRenderer(['UUE'], function(objectUUE /*, render*/){
      var mimeType = MIME.lookup(objectUUE.name);
      if([
         'image/jpeg',
         'image/png',
         'image/gif',
         'image/svg+xml'
      ].indexOf(mimeType) >= 0 ){ // image
         var addSourceData = '';
         if( _converter.options.dataMode ){
            addSourceData = [
               ' data-source="',
               Buffer(
                  objectUUE.source
               ).toString('base64'),
               '"'
            ].join('');
         }
         return [
            '<div class="imageUUE" ',
            'data-name="',
            _s.escapeHTML( objectUUE.name ),
            '"',
            addSourceData,
            '>',
            '<img src="',
            Dauria.getBase64DataURI(objectUUE.data, mimeType),
            '">',
            '</div>'
         ].join('');
      } else { // not an image
         if( _converter.options.dataMode ){
            return [
               '<div class="fileUUE" data-name="',
               _s.escapeHTML( objectUUE.name ),
               '" data-content="',
               objectUUE.data.toString('base64'),
               '">',
               objectUUE.source,
               '</div>'
            ].join('');
         } else { // not an image, and not in dataMode
            return [
               '<a class="fileUUE" href="',
               Dauria.getBase64DataURI(objectUUE.data, mimeType),
               '">',
               objectUUE.source,
               '</a>'
            ].join('');
         }
      }
   });

   // convert URLs to hyperlinks
   this.ASTree.defineSplitter(function(sourceCode){
      /* jshint -W101 */
      if( typeof sourceCode !== 'string' ) return sourceCode;
      return sourceCode.split(
         /(\b(?:https?|ftp|mailto|bitcoin|ed2k|facetime|feed|geo|irc(?:6|s)?|magnet|mms|news|nntp|sips?|skype|sms|ssh|tel|telnet|tftp|xmpp):[^\s<>\x22\x27{}|\^\[\]`]+)/
      ).map(function(sourceFragment, fragmentIndex){
         if( fragmentIndex % 2 === 0 ){ // simple fragment's index: 0, 2...
            return sourceFragment;
         } else { // regex-captured fragment's index: 1, 3, 5...
            return {
               type: 'hyperlink',
               URL: sourceFragment,
               textURL: sourceFragment
            };
         }
      });
   });
   this.ASTree.defineRenderer(['hyperlink'], function(hyperlink /*, render*/){
      if( _converter.options.dataMode ){
         return '<a href="javascript:;" data-href="' + hyperlink.URL + '">' +
                hyperlink.textURL + '</a>';
      }
      return '<a href="' + hyperlink.URL + '">' + hyperlink.textURL + '</a>';
   });

   // perform character replacements:
   // *) in plain text
   // *) in quoted text
   // *) in UUE code blocks
   // *) in the text of URLs
   this.ASTree.defineSplitter(function(sourceNode){
      if( typeof sourceNode !== 'string' ) return sourceNode;

      var replacements = [
         [/  /g, ' \u00A0'],
         [/&/g, '&amp;'],
         [/</g, '&lt;'],
         [/>/g, '&gt;'],
         [/\x22/g, '&quot;'],
         [/\r?\n/g, '<br>']
      ];

      return replacements.reduce(function(result, replacement){
         return result.replace(replacement[0], replacement[1]);
      }, sourceNode);
   }, [
      { type: 'quote', props: [ 'quotedText' ] },
      { type: 'UUE', props: [ 'source' ] },
      { type: 'hyperlink', props: [ 'textURL' ] }
   ]);
};

FidoHTML.prototype.fromText = function(msgText){
   return this.ASTree.render(msgText);
};

module.exports = FidoHTML;
