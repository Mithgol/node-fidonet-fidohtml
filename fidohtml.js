var ASTree = require('astree');

var FidoHTML = function(options){
   if (!(this instanceof FidoHTML)) return new FidoHTML(options);

   if( typeof options === 'undefined' ) options = {};
   this.options = options;

   var _converter = this;
   this.ASTree = ASTree();

   // do not break spaces in the beginning of the lines
   this.ASTree.defineSplitter(function(sourceText){
      return sourceText.replace(/(^|\r?\n) /g, '$1\u00A0');
   });

   // convert URLs to hyperlinks
   this.ASTree.defineSplitter(function(sourceCode){
      /* jshint -W101 */
      return sourceCode.split(
         /(\b(?:https?|ftp|mailto|bitcoin|ed2k|facetime|feed|geo|irc(?:6|s)?|magnet|mms|news|nntp|sips?|skype|sms|ssh|tel|telnet|tftp|xmpp):[^\s<>\x22\x27{}|\^\[\]`]+)/
      ).map(function(sourceFragment, fragmentIndex){
         if( fragmentIndex % 2 === 0 ){ // simple fragment's index: 0, 2...
            return sourceFragment;
         } else { // regex-captured fragment's index: 1, 3, 5...
            return {
               type: 'hyperlink',
               URL: sourceFragment
            };
         }
      });
   });
   this.ASTree.defineRenderer(['hyperlink'], function(hyperlink /*, render*/){
      if( _converter.options.dataMode ){
         return '<a href="javascript:;" data-href="' + hyperlink.URL + '">' +
                hyperlink.URL + '</a>';
      }
      return '<a href="' + hyperlink.URL + '">' + hyperlink.URL + '</a>';
   });

   // (in plain text only) perform character replacements
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
   });
};

FidoHTML.prototype.fromText = function(msgText){
   return this.ASTree.render(msgText);
};

module.exports = FidoHTML;
